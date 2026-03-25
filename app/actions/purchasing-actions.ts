"use server"

import { prisma } from "@/lib/prisma"
import { PurchaseOrder, PurchaseOrderItem, POStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

import { format } from "date-fns"

// ... previous exports

export async function importPurchaseOrder(formData: FormData) {
    const file = formData.get('file') as File
    const vendorId = formData.get('vendorId') as string

    if (!file || !vendorId) return { success: false, error: "Missing file or vendor" }

    try {
        const buffer = await file.arrayBuffer()
        const text = new TextDecoder().decode(buffer)
        const lines = text.split('\n')

        // Sysco Header Logic
        const firstLine = lines[0].split(',').map(s => s.replace(/"/g, '').trim())

        let fileDate: Date | null = null
        let fileTotal = 0

        if (firstLine[0] === 'H') {
            // Sysco: H,O0601,013,705791,Jan 18 2026 11:04 PM ,01/21/2026,Y,, ,06845151,06845151,1305.29
            const dateStr = firstLine[4]
            fileDate = new Date(dateStr)
            fileTotal = parseFloat(firstLine[11])
        }

        if (!fileDate || isNaN(fileTotal)) {
            return { success: false, error: "Could not identify Sysco header (Date/Total missing)" }
        }

        // DUPLICATE CHECK
        const existingPO = await prisma.purchaseOrder.findFirst({
            where: {
                vendorId: vendorId,
                totalCost: fileTotal,
                sourceFile: file.name
            }
        })

        if (existingPO) {
            return { success: false, error: `Duplicate: PO with total $${fileTotal} from file '${file.name}' already exists.` }
        }

        // Create PO
        let po = await prisma.purchaseOrder.create({
            data: {
                vendorId,
                status: "DRAFT",
                totalCost: 0, // Will update
                expectedDate: fileDate,
                sourceFile: file.name,
                notes: `Imported from ${file.name}`
            }
        })

        let calculatedTotal = 0

        // Parse Items
        for (let i = 1; i < lines.length; i++) {
            // Simple regex for CSV splitting ignoring commas in quotes
            const row = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
            if (!row) continue

            const cleanRow = row.map(c => c.replace(/^"|"$/g, '').replace(/,$/, '').trim())

            if (cleanRow[0] !== 'P') continue

            const sku = cleanRow[1]
            const qty = parseFloat(cleanRow[2])
            const desc = cleanRow[7]
            const rawCost = cleanRow[11] || cleanRow[10]

            if (!sku) continue

            // Find Item
            let item = await prisma.item.findFirst({
                where: { sku: sku }
            })

            if (!item && desc) {
                item = await prisma.item.findFirst({ where: { name: desc } })
            }

            if (!item) {
                continue // Skip unknowns for now as per plan
            }

            let unitCost = parseFloat(rawCost) || 0
            if (unitCost === 0 && item.cost > 0) {
                unitCost = item.cost // Fallback
            }

            await prisma.purchaseOrderItem.create({
                data: {
                    poId: po.id,
                    itemId: item.id,
                    quantity: qty,
                    unitCost: unitCost
                }
            })

            calculatedTotal += (qty * unitCost)
        }

        // Update Total
        await prisma.purchaseOrder.update({
            where: { id: po.id },
            data: { totalCost: calculatedTotal } // Use calculated total to be safe, or separate field?
            // Actually, for duplication check we used file header total. 
            // If we parsed correctly, they should match. Let's stick with calculated.
        })

        revalidatePath('/purchasing')
        return { success: true }
    } catch (e: any) {
        console.error("PO Import Error", e)
        return { success: false, error: e.message }
    }
}


export async function getPO(id: string) {
    return await prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
            vendor: true,
            items: {
                include: {
                    item: true
                }
            }
        }
    })
}

export async function createPO(vendorId: string) {
    try {
        const po = await prisma.purchaseOrder.create({
            data: {
                vendorId,
                status: "DRAFT"
            }
        })
        revalidatePath('/purchasing')
        return { success: true, id: po.id }
    } catch (error) {
        return { success: false, error: "Failed to create PO" }
    }
}

export async function addPOItem(poId: string, itemId: string, quantity: number, unitCost: number) {
    try {
        await prisma.purchaseOrderItem.create({
            data: {
                poId,
                itemId,
                quantity,
                unitCost
            }
        })
        // Update total cost
        await recalculatePOTotal(poId)

        revalidatePath(`/purchasing/${poId}`)
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}

async function recalculatePOTotal(poId: string) {
    const items = await prisma.purchaseOrderItem.findMany({ where: { poId } })
    const total = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0)
    await prisma.purchaseOrder.update({
        where: { id: poId },
        data: { totalCost: total }
    })
}

export async function receivePO(poId: string) {
    const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true }
    })

    if (!po || po.status === 'CLOSED') return { success: false, error: "Invalid PO" }

    await prisma.$transaction(async (tx) => {
        // Update PO Status
        await tx.purchaseOrder.update({
            where: { id: poId },
            data: { status: "CLOSED" }
        })

        // Increase Inventory
        for (const item of po.items) {
            await tx.item.update({
                where: { id: item.itemId },
                data: {
                    onHand: { increment: item.quantity },
                    cost: item.unitCost, // Update last cost
                    lastPurchasedAt: new Date()
                }
            })

            await tx.transaction.create({
                data: {
                    type: "RECEIVE",
                    itemId: item.itemId,
                    quantityChange: item.quantity,
                    reason: `PO Received`,
                    referenceId: poId,
                    costAtTime: item.unitCost
                }
            })

            // Log vendor price history
            await tx.vendorPriceHistory.create({
                data: {
                    vendorId: po.vendorId,
                    itemId: item.itemId,
                    price: item.unitCost
                }
            })
        }
    })

    revalidatePath('/purchasing')
    return { success: true }
}

export async function getPOs() {
    return await prisma.purchaseOrder.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            vendor: true,
            _count: {
                select: { items: true }
            }
        }
    })
}
