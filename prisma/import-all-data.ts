import * as XLSX from 'xlsx';
import { PrismaClient, ItemType, UnitType } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const dataDir = path.join(process.cwd(), 'data');

async function getOrCreateVendor(name: string) {
    let vendor = await prisma.vendor.findFirst({ where: { name } });
    if (!vendor) {
        vendor = await prisma.vendor.create({ data: { name } });
        console.log(`Created Vendor: ${name}`);
    }
    return vendor;
}

async function getOrCreateCategory(name: string, type: ItemType) {
    let cat = await prisma.category.findFirst({ where: { name } });
    if (!cat) {
        cat = await prisma.category.create({ data: { name, type } });
    }
    return cat;
}

async function main() {
    // 1. Import General Food Inventory (5Monkeys Inventory .xlsx)
    // Structure: Columns are Categories, Rows are Items
    console.log("--- Importing General Food Inventory ---");
    const foodFile = path.join(dataDir, '5Monkeys Inventory .xlsx');
    if (fs.existsSync(foodFile)) {
        const wb = XLSX.readFile(foodFile);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][]; // Array of arrays

        const headers = data[0]; // ['Vegetables', 'Dairy', ...]

        // Create Categories first
        for (const header of headers) {
            if (!header) continue;
            await getOrCreateCategory(header.trim(), 'KITCHEN');
        }

        // Iterate Rows
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            for (let c = 0; c < headers.length; c++) {
                const catName = headers[c];
                const itemName = row[c];

                if (catName && itemName) {
                    const category = await prisma.category.findFirst({ where: { name: catName.trim() } });
                    if (!category) continue;

                    const existing = await prisma.item.findFirst({ where: { name: itemName.trim() } });
                    if (!existing) {
                        await prisma.item.create({
                            data: {
                                name: itemName.trim(),
                                type: 'KITCHEN',
                                unitType: 'EACH', // Default
                                categoryId: category.id,
                                onHand: 0
                            }
                        });
                        // console.log(`Created Item: ${itemName.trim()} (${catName})`);
                    }
                }
            }
        }
        console.log("General Food Import Done.");
    }

    // 2. Import Vendor Items (Sysco & RD from Vendor_Price_Comparison.xlsx)
    console.log("--- Importing Vendor Catalogs ---");
    const vendorFile = path.join(dataDir, 'Vendor_Price_Comparison.xlsx');

    // Vendors
    const sysco = await getOrCreateVendor('Sysco');
    const rd = await getOrCreateVendor('Restaurant Depot');

    if (fs.existsSync(vendorFile)) {
        const wb = XLSX.readFile(vendorFile);

        // SYSCO
        const syscoSheet = wb.Sheets['Sysco_Raw_Dedup'];
        if (syscoSheet) {
            const syscoData = XLSX.utils.sheet_to_json(syscoSheet) as any[];
            const syscoCat = await getOrCreateCategory("Sysco Import", "KITCHEN");

            for (const row of syscoData) {
                const name = row['Sysco Item Name'];
                const brand = row['Sysco Brand'];
                const supc = row['Sysco SUPC'];
                const pack = row['Sysco Pack Size'];
                const cost = row['Sysco Case $'] || row['Sysco Each $'];

                if (!name) continue;

                // Find or Create Item
                // We try to match by name, otherwise create new
                let item = await prisma.item.findFirst({ where: { name } });
                if (!item) {
                    item = await prisma.item.create({
                        data: {
                            name,
                            brand: brand ? String(brand) : null,
                            sku: supc ? String(supc) : null,
                            type: 'KITCHEN',
                            unitType: 'CASE', // Assuming checks mostly handled cases
                            packSize: pack ? String(pack) : null,
                            categoryId: syscoCat.id,
                            preferredVendorId: sysco.id,
                            cost: typeof cost === 'number' ? cost : 0
                        }
                    });
                } else {
                    // Update vendor linkage
                    await prisma.item.update({
                        where: { id: item.id },
                        data: {
                            preferredVendorId: sysco.id,
                            sku: supc ? String(supc) : item.sku,
                            cost: (typeof cost === 'number' && cost > 0) ? cost : item.cost
                        }
                    });
                }

                // Add Price History
                if (typeof cost === 'number') {
                    await prisma.vendorPriceHistory.create({
                        data: {
                            vendorId: sysco.id,
                            itemId: item.id,
                            price: cost
                        }
                    });
                }
            }
        }

        // Restaurant Depot
        const rdSheet = wb.Sheets['RestaurantDepot_Raw'];
        if (rdSheet) {
            const rdData = XLSX.utils.sheet_to_json(rdSheet) as any[];
            const rdCat = await getOrCreateCategory("Restaurant Depot Import", "KITCHEN");

            for (const row of rdData) {
                const name = row['Item Name'];
                const itemNo = row['Item No'];
                const pack = row['Pack Size'];
                const price = row['Unit Price'];

                if (!name) continue;

                let item = await prisma.item.findFirst({ where: { name } });
                if (!item) {
                    item = await prisma.item.create({
                        data: {
                            name,
                            sku: itemNo ? String(itemNo) : null,
                            type: 'KITCHEN',
                            unitType: 'EACH',
                            packSize: pack ? String(pack) : null,
                            categoryId: rdCat.id,
                            preferredVendorId: rd.id,
                            cost: typeof price === 'number' ? price : 0
                        }
                    });
                }
            }
        }
    }
    console.log("Vendor Catalogs Imported.");

    // 3. Create Sysco Order Verification (Jan 18 2026...csv)
    // The user wants to "Verify and Test" a Sysco Order.
    console.log("--- Creating Sysco Test Order ---");
    const orderFile = path.join(dataDir, 'Jan 18 2026 11_04 PM (1).csv');
    if (fs.existsSync(orderFile)) {
        // Manual CSV Parse
        const rawData = fs.readFileSync(orderFile, 'utf-8');
        const lines = rawData.split(/\r?\n/);

        // Helper to split CSV line respecting quotes (basic version, or just split by comma if simple)
        // The inspection showed standard CSV.

        // Find header line index
        let headerIndex = -1;
        for (let i = 0; i < Math.min(10, lines.length); i++) {
            if (lines[i].includes('SUPC') && lines[i].includes('Description')) {
                headerIndex = i;
                break;
            }
        }

        if (headerIndex === -1) {
            console.log("Could not find header row in Sysco CSV");
            return;
        }

        // Map headers to indices
        const headers = lines[headerIndex].split(',').map(h => h.trim().replace(/"/g, ''));
        const colMap = {
            supc: headers.indexOf('SUPC'),
            desc: headers.indexOf('Description'),
            caseQty: headers.indexOf('Case Qty'),
            splitQty: headers.indexOf('Split Qty'),
            caseCost: headers.indexOf('Case $'),
            eachCost: headers.indexOf('Each $')
        };

        console.log("Column Mapping:", colMap);

        // Create PO
        const po = await prisma.purchaseOrder.create({
            data: {
                vendorId: sysco.id,
                status: 'DRAFT',
                notes: 'Imported Sysco Verification Order'
            }
        });

        let poTotal = 0;

        for (let i = headerIndex + 1; i < lines.length; i++) {
            const line = lines[i];
            if (!line.trim()) continue;

            // Basic CSV split - warning: description might contain commas!
            // For robustness, really should use a library, but let's try a regex match or just finding the numeric columns from the end if desc is messy.
            // Actually, let's use the simple split for now, inspecting earlier showed "Tomato Roma Fresh", no commas.
            // IF there are commas in description, this will break.
            // But let's try.
            const cols = line.split(',').map(c => c.trim().replace(/"/g, ''));

            const supc = cols[colMap.supc];
            const desc = cols[colMap.desc];
            const qty = cols[colMap.caseQty] !== '0' ? cols[colMap.caseQty] : cols[colMap.splitQty];
            const cost = cols[colMap.caseQty] !== '0' ? cols[colMap.caseCost] : cols[colMap.eachCost];

            if (i < headerIndex + 5) {
                console.log(`Row ${i} Raw Cost: "${cost}"`, cols);
            }

            if (!desc || !qty) continue;

            // Find item
            let item = await prisma.item.findFirst({
                where: {
                    OR: [
                        { sku: String(supc) },
                        { name: desc }
                    ]
                }
            });

            if (!item) {
                const syscoCat = await getOrCreateCategory("Sysco Import", "KITCHEN");
                item = await prisma.item.create({
                    data: {
                        name: desc,
                        sku: String(supc),
                        categoryId: syscoCat.id, // Connect via ID
                        type: 'KITCHEN',
                        unitType: 'CASE',
                        preferredVendorId: sysco.id
                    }
                });
            }

            const cleanQty = parseFloat(qty);
            let cleanCost = parseFloat(cost) || 0;

            if (cleanCost === 0 && item.cost > 0) {
                // Fallback to catalog cost
                cleanCost = item.cost;
            }

            await prisma.purchaseOrderItem.create({
                data: {
                    poId: po.id,
                    itemId: item.id,
                    quantity: cleanQty,
                    unitCost: cleanCost
                }
            });

            poTotal += (cleanQty * cleanCost);
        }

        // Update Total
        await prisma.purchaseOrder.update({
            where: { id: po.id },
            data: { totalCost: poTotal }
        });

        console.log(`Created PO: ${po.id} with Total: $${poTotal.toFixed(2)}`);
    } else {
        console.log("Sysco Order File not found.");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
