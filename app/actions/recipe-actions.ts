"use server"

import { prisma } from "@/lib/prisma"
import { Recipe, RecipeIngredient } from "@prisma/client"
import { revalidatePath } from "next/cache"

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
    try {
        const recipe = await prisma.recipe.create({
            data: { name }
        })
        revalidatePath('/recipes')
        return { success: true, id: recipe.id }
    } catch (error) {
        return { success: false, error: "Failed to create recipe" }
    }
}

export async function addIngredient(recipeId: string, itemId: string, quantity: number, unit: string) {
    try {
        await prisma.recipeIngredient.create({
            data: {
                recipeId,
                itemId,
                quantity,
                unit
            }
        })
        revalidatePath(`/recipes/${recipeId}`)
        return { success: true }
    } catch (error) {
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
