"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { createRecipeSchema, addIngredientSchema, formatZodError } from "@/lib/schemas"

export async function getRecipes() {
    return await prisma.recipe.findMany({
        include: {
            _count: { select: { ingredients: true } }
        },
        orderBy: { name: 'asc' }
    })
}

export async function getRecipe(id: string) {
    return await prisma.recipe.findUnique({
        where: { id },
        include: {
            ingredients: {
                include: {
                    item: true
                }
            }
        }
    })
}

export async function createRecipe(name: string) {
    const parsed = createRecipeSchema.safeParse({ name })
    if (!parsed.success) return { success: false, error: formatZodError(parsed.error) }

    try {
        const recipe = await prisma.recipe.create({
            data: { name: parsed.data.name }
        })
        revalidatePath('/recipes')
        return { success: true, id: recipe.id }
    } catch (error) {
        console.error("Failed to create recipe:", error)
        return { success: false, error: "Failed to create recipe" }
    }
}

export async function addIngredient(recipeId: string, itemId: string, quantity: number, unit: string) {
    const parsed = addIngredientSchema.safeParse({ recipeId, itemId, quantity, unit })
    if (!parsed.success) return { success: false, error: formatZodError(parsed.error) }

    try {
        await prisma.recipeIngredient.create({
            data: parsed.data
        })
        revalidatePath(`/recipes/${parsed.data.recipeId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to add ingredient:", error)
        return { success: false, error: "Failed to add ingredient" }
    }
}

export async function removeIngredient(id: string) {
    try {
        await prisma.recipeIngredient.delete({ where: { id } })
        revalidatePath('/recipes/[id]') // Logic needs context usually, but revalidatePath works on strict paths too
        return { success: true }
    } catch (error) {
        return { success: false }
    }
}
