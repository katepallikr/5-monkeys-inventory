"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import {
    syscoHeaderSchema,
    syscoLineItemSchema,
    validateImportFile,
    createPoSchema,
    addPOItemSchema,
    formatZodError,
} from "@/lib/schemas"

// ... previous exports

function splitCsvLine(line: string): string[] {
    const row = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g)
    if (!row) return []
    return row.map((c) => c.replace(/^"|"$/g, '').replace(/,$/, '').trim())
}

export async function importPurchaseOrder(formData: FormData) {
    const file = formData.get('file') as File | null
    const vendorId = formData.get('vendorId') as string | null

    const fileError = validateImportFile(file, ["csv"])
    if (fileError) return { success: false, error: fileError }
    if (!vendorId) return { success: false, error: "Please select a vendor" }

    try {
        const buffer = await file!.arrayBuffer()
        const text = new TextDecoder().decode(buffer)
        const lines = text.split('\n').filter((l) => l.trim().length > 0)

        if (lines.length === 0) {
            return { success: false, error: "The file is empty" }
        }

        // Sysco Header Logic: H,O0601,013,705791,Jan 18 2026 11:04 PM ,01/21/2026,Y,, ,06845151,06845151,1305.29
        const firstLine = splitCsvLine(lines[0])

        if (firstLine[0] !== 'H') {
            return { success: false, error: "Could not find a Sysco header row (expected the first line to start with 'H')" }
        }

        const headerParsed = syscoHeaderSchema.safeParse({ dateStr: firstLine[4], total: firstLine[11] })
        if (!headerParsed.success) {
            return { success: false, error: `Invalid Sysco header: ${headerParsed.error.issues.map((i) => i.message).join(", ")}` }
        }

        const fileDate = new Date(headerParsed.data.dateStr)
        if (isNaN(fileDate.getTime())) {
            return { success: false, error: `Could not parse order date "${headerParsed.data.dateStr}" from the header` }
        }
        const fileTotal = headerParsed.data.total

        // Parse + structurally validate product lines before writing anything to the DB
        type ParsedLine = { sku: string; qty: number; desc?: string; rawCost?: string }
        const parsedLines: ParsedLine[] = []
        let malformedLineCount = 0

        for (let i = 1; i < lines.length; i++) {
            const cleanRow = splitCsvLine(lines[i])
            if (cleanRow[0] !== 'P') continue

            const lineParsed = syscoLineItemSchema.safeParse({ sku: cleanRow[1], qty: cleanRow[2] })
            if (!lineParsed.success) {
                malformedLineCount++
                continue
            }

            parsedLines.push({
                sku: lineParsed.data.sku,
                qty: lineParsed.data.qty,
                desc: cleanRow[7],
                rawCost: cleanRow[11] || cleanRow[10],
            })
        }

        if (parsedLines.length === 0) {
            return { success: false, error: "No valid product lines ('P' rows) were found in the file" }
        }

        // DUPLICATE CHECK
        // Match on vendor + source filename only. The stored totalCost is computed from
        // matched line items (see below) and can legitimately differ from the file
        // header's stated total, so comparing against it here made duplicates slip through.
        const existingPO = await prisma.purchaseOrder.findFirst({
            where: {
                vendorId: vendorId,
                sourceFile: file!.name
            }
        })

        if (existingPO) {
            return { success: false, error: `Duplicate: a PO from file '${file!.name}' already exists for this vendor.` }
        }

        let calculatedTotal = 0
        let matchedCount = 0
        const unmatchedSkus: string[] = []

        // Wrap PO creation + line items in a transaction so a mid-import failure
        // doesn't leave a partially-populated purchase order behind.
        await prisma.$transaction(async (tx) => {
            const po = await tx.purchaseOrder.create({
                data: {
                    vendorId,
                    status: "DRAFT",
                    totalCost: 0, // Will update
                    expectedDate: fileDate,
                    sourceFile: file!.name,
                    notes: `Imported from ${file!.name}`
                }
            })

            for (const { sku, qty, desc, rawCost } of parsedLines) {
                // Find Item
                let item = await tx.item.findFirst({
                    where: { sku: sku }
                })

                if (!item && desc) {
                    item = await tx.item.findFirst({ where: { name: desc } })
                }

                if (!item) {
                    if (unmatchedSkus.length < 20) unmatchedSkus.push(sku)
                    continue // Skip unknowns for now as per plan
                }

                let unitCost = parseFloat(rawCost || "") || 0
                if (unitCost === 0 && item.cost > 0) {
                    unitCost = item.cost // Fallback
                }

                await tx.purchaseOrderItem.create({
                    data: {
                        poId: po.id,
                        itemId: item.id,
                        quantity: qty,
                        unitCost: unitCost
                    }
                })

                calculatedTotal += (qty * unitCost)
                matchedCount++
            }

            // Update Total
            await tx.purchaseOrder.update({
                where: { id: po.id },
                data: { totalCost: calculatedTotal } // Use calculated total to be safe, or separate field?
                // Actually, for duplication check we used file header total.
                // If we parsed correctly, they should match. Let's stick with calculated.
            })
        })

        revalidatePath('/purchasing')
        return {
            success: true,
            data: { matchedCount, unmatchedCount: unmatchedSkus.length, unmatchedSkus, malformedLineCount }
        }
    } catch (e: unknown) {
        console.error("PO Import Error", e)
        return { success: false, error: e instanceof Error ? e.message : "Import failed. No changes were saved." }
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
    const parsed = createPoSchema.safeParse({ vendorId })
    if (!parsed.success) return { success: false, error: formatZodError(parsed.error) }

    try {
        const po = await prisma.purchaseOrder.create({
            data: {
                vendorId: parsed.data.vendorId,
                status: "DRAFT"
            }
        })
        revalidatePath('/purchasing')
        return { success: true, id: po.id }
    } catch (error) {
        console.error("Failed to create PO:", error)
        return { success: false, error: "Failed to create PO" }
    }
}

export async function addPOItem(poId: string, itemId: string, quantity: number, unitCost: number) {
    const parsed = addPOItemSchema.safeParse({ poId, itemId, quantity, unitCost })
    if (!parsed.success) return { success: false, error: formatZodError(parsed.error) }

    try {
        await prisma.purchaseOrderItem.create({
            data: parsed.data
        })
        // Update total cost
        await recalculatePOTotal(parsed.data.poId)

        revalidatePath(`/purchasing/${parsed.data.poId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to add PO item:", error)
        return { success: false, error: "Failed to add item to PO" }
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
