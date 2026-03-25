"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import * as XLSX from 'xlsx' // Using xlsx for CSV parsing as it's robust

// CSV Structure based on inspection
interface PmixRow {
    "Menu Item": string
    "Item Qty": number
    // other fields...
}

export async function importSales(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) return { success: false, error: "No file uploaded" }

    try {
        // Check for duplicate file
        const existingBatch = await prisma.salesBatch.findUnique({
            where: { filename: file.name }
        })

        if (existingBatch) {
            return {
                success: false,
                error: `This file was already processed on ${existingBatch.processedAt.toLocaleDateString()}`
            }
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(buffer, { type: 'buffer' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet) as any[]

        let processedCount = 0
        let depletionCount = 0
        let missingRecipeCount = 0

        // Create a transaction group to log this import
        const batchId = `IMPORT-${Date.now()}`

        await prisma.$transaction(async (tx) => {
            // Create Batch Record
            await tx.salesBatch.create({
                data: {
                    filename: file.name,
                    totalUnits: 0 // Will update later if needed, but for now just tracking existence
                }
            })

            for (const row of rows) {
                const menuItemName = row['Menu Item']
                const qtySold = Number(row['Item Qty'])

                // Skip summary lines or empty rows
                if (!menuItemName || isNaN(qtySold) || qtySold === 0) continue

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
            data: { processedCount, missingRecipeCount, depletionCount }
        }

    } catch (error) {
        console.error("Import failed:", error)
        return { success: false, error: "Import failed" }
    }
}
