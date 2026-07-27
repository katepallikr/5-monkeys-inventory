"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from 'xlsx' // Using xlsx for CSV parsing as it's robust
import { salesRowSchema, validateImportFile } from "@/lib/schemas"

// Different POS exports use different column names for the same two fields.
// Add an entry here to support another export format.
const ITEM_NAME_COLUMNS = ["Menu Item", "Item"] // Toast pmix / Square Item Sales
const QTY_SOLD_COLUMNS = ["Item Qty", "Qty sold"] // Toast pmix / Square Item Sales

function normalizeSalesRow(row: Record<string, unknown>) {
    const menuItemName = ITEM_NAME_COLUMNS.map((col) => row[col]).find((v) => v !== undefined)
    const qtySold = QTY_SOLD_COLUMNS.map((col) => row[col]).find((v) => v !== undefined)
    return { menuItemName, qtySold }
}

export async function importSales(formData: FormData) {
    const file = formData.get('file') as File | null

    const fileError = validateImportFile(file, ["csv", "xlsx", "xls"])
    if (fileError) return { success: false, error: fileError }

    try {
        // Check for duplicate file
        const existingBatch = await prisma.salesBatch.findUnique({
            where: { filename: file!.name }
        })

        if (existingBatch) {
            return {
                success: false,
                error: `This file was already processed on ${existingBatch.processedAt.toLocaleDateString()}`
            }
        }

        const buffer = await file!.arrayBuffer()
        let workbook: XLSX.WorkBook
        try {
            workbook = XLSX.read(buffer, { type: 'buffer' })
        } catch {
            return { success: false, error: "Could not read file. Make sure it's a valid CSV or Excel export." }
        }

        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
            return { success: false, error: "The file has no sheets/data to import." }
        }
        const sheet = workbook.Sheets[sheetName]
        const rawRows = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[]

        if (rawRows.length === 0) {
            return { success: false, error: "The file has no rows to import." }
        }

        // Validate every row up front so a malformed file is rejected before
        // any database writes happen (no orphaned SalesBatch on failure).
        let skippedRowCount = 0
        const rowErrors: string[] = []
        const validRows: { menuItemName: string; qtySold: number }[] = []

        for (let i = 0; i < rawRows.length; i++) {
            const parsed = salesRowSchema.safeParse(normalizeSalesRow(rawRows[i]))

            if (!parsed.success) {
                // Summary/subtotal lines and blank rows commonly lack an item name -
                // treat those as expected skips, but keep a sample of real parse errors.
                const menuItemMissing = parsed.error.issues.every((issue) => issue.path[0] === "menuItemName")
                if (!menuItemMissing && rowErrors.length < 10) {
                    rowErrors.push(`Row ${i + 2}: ${parsed.error.issues.map((e) => e.message).join(", ")}`)
                }
                skippedRowCount++
                continue
            }

            if (parsed.data.qtySold === 0) {
                skippedRowCount++
                continue
            }

            validRows.push(parsed.data)
        }

        if (validRows.length === 0) {
            return {
                success: false,
                error: "No valid sales rows were found. Expected a 'Menu Item'/'Item Qty' (Toast) or 'Item'/'Qty sold' (Square) column pair."
            }
        }

        let processedCount = 0
        let depletionCount = 0
        let missingRecipeCount = 0

        // Create a transaction group to log this import
        const batchId = `IMPORT-${Date.now()}`

        await prisma.$transaction(async (tx) => {
            // Create Batch Record
            await tx.salesBatch.create({
                data: {
                    filename: file!.name,
                    totalUnits: 0 // Will update later if needed, but for now just tracking existence
                }
            })

            for (const { menuItemName, qtySold } of validRows) {
                processedCount++

                // 1. Find or Create Recipe
                let recipe = await tx.recipe.findFirst({
                    where: { name: menuItemName },
                    include: { ingredients: true }
                })

                if (!recipe) {
                    recipe = await tx.recipe.create({
                        data: { name: menuItemName },
                        include: { ingredients: true }
                    })
                    missingRecipeCount++
                }

                // 2. Deplete Inventory
                if (recipe.ingredients.length > 0) {
                    for (const ing of recipe.ingredients) {
                        const totalDepletion = ing.quantity * qtySold

                        await tx.item.update({
                            where: { id: ing.itemId },
                            data: {
                                onHand: { decrement: totalDepletion }
                            }
                        })

                        await tx.transaction.create({
                            data: {
                                type: "SALE",
                                itemId: ing.itemId,
                                quantityChange: -totalDepletion,
                                referenceId: batchId,
                                reason: `Sales: ${menuItemName} x${qtySold}`
                            }
                        })
                    }
                    depletionCount += qtySold
                }
            }
        })

        revalidatePath('/recipes')
        return {
            success: true,
            data: { processedCount, missingRecipeCount, depletionCount, skippedRowCount, rowErrors }
        }

    } catch (error) {
        console.error("Sales import failed:", error)
        return { success: false, error: "Import failed. No changes were saved." }
    }
}
