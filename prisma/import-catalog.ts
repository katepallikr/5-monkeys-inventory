import * as XLSX from 'xlsx';
import { PrismaClient, ItemType, UnitType } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), 'data', '5Monkeys_Master_Inventory_Phase1_2.xlsx');
    console.log(`Reading file: ${filePath}`);

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    console.log(`Found ${rows.length} rows.`);

    // 1. Pre-fetch existing Categories/SubCats to minimize DB calls or just upsert as we go
    // We'll upsert as we go for simplicity in script

    let createdCount = 0;

    for (const row of rows) {
        const catName = row['Category']?.trim();
        const subCatName = row['Sub-Category']?.trim();
        const itemName = row['Item Name']?.trim();

        if (!itemName || !catName) continue;

        // Determine Type
        let type: ItemType = 'KITCHEN';
        if (['Liquor', 'Beer', 'Wine', 'Bar'].some(t => catName.includes(t))) type = 'BAR';
        if (catName.includes('Hookah') || catName.includes('Tobacco')) type = 'HOOKAH';

        // Upsert Category
        let category = await prisma.category.findFirst({ where: { name: catName } });
        if (!category) {
            category = await prisma.category.create({ data: { name: catName, type } });
            console.log(`Created Category: ${catName}`);
        }

        // Upsert SubCategory
        let subCategoryId = null;
        if (subCatName) {
            let subCategory = await prisma.subCategory.findFirst({
                where: { name: subCatName, categoryId: category.id }
            });
            if (!subCategory) {
                subCategory = await prisma.subCategory.create({
                    data: { name: subCatName, categoryId: category.id }
                });
                console.log(`Created SubCategory: ${subCatName}`);
            }
            subCategoryId = subCategory.id;
        }

        // Unit Logic & Volume
        let unit: UnitType = 'EACH';
        let bottleVol = null;
        const rowUnit = row['Unit']?.toLowerCase();
        const rowSize = row['Size']?.toString().toLowerCase();

        if (rowUnit?.includes('bottle') || rowUnit?.includes('btl')) unit = 'BOTTLE';
        else if (rowUnit?.includes('case') || rowUnit?.includes('cs')) unit = 'CASE';
        else if (rowUnit?.includes('lb') || rowUnit?.includes('pound')) unit = 'LB';
        else if (rowUnit?.includes('oz')) unit = 'OZ';
        else if (rowUnit?.includes('keg')) unit = 'KEG';

        if (type === 'BAR' && unit === 'BOTTLE') {
            // Try to parse volume from size like "1L", "750ml"
            if (rowSize?.includes('1l')) bottleVol = 1000;
            else if (rowSize?.includes('750')) bottleVol = 750;
            else if (rowSize?.includes('1.75')) bottleVol = 1750;
        }

        // Upsert Item
        const existingItem = await prisma.item.findFirst({
            where: {
                name: itemName,
                categoryId: category.id
            }
        });

        if (!existingItem) {
            await prisma.item.create({
                data: {
                    name: itemName,
                    brand: row['Brand'] ? String(row['Brand']) : null,
                    categoryId: category.id,
                    subCategoryId: subCategoryId,
                    type,
                    unitType: unit,
                    bottleVolumeMl: bottleVol,
                    pourSizeOz: row['Pour Size (oz)'] ? parseFloat(row['Pour Size (oz)']) : (type === 'BAR' ? 1.5 : null),
                    minPar: row['Par Level'] ? parseFloat(row['Par Level']) : 0,
                    reorderQty: row['Reorder Qty'] ? parseFloat(row['Reorder Qty']) : 0,
                    onHand: 0 // Start with 0 or undefined
                }
            });
            createdCount++;
        }
    }

    console.log(`Import completed. Added ${createdCount} items.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
