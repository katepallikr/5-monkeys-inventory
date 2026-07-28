"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { categorySchema, subCategorySchema, formatZodError } from "@/lib/schemas"
import { requireAdmin } from "@/app/actions/auth-actions"

export async function getCategoriesWithSub() {
    try {
        return await prisma.category.findMany({
            include: { subCategories: true, _count: { select: { items: true } } },
            orderBy: { name: "asc" },
        })
    } catch (error) {
        console.error("Failed to fetch categories:", error)
        return []
    }
}

export async function createCategory(data: unknown) {
    const gate = await requireAdmin()
    if (!gate.success) return gate

    const parsed = categorySchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: formatZodError(parsed.error) }
    }

    try {
        await prisma.category.create({ data: parsed.data })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to create category:", error)
        return { success: false, error: "Failed to create category" }
    }
}

export async function deleteCategory(id: string) {
    const gate = await requireAdmin()
    if (!gate.success) return gate

    try {
        await prisma.category.delete({ where: { id } })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete category:", error)
        return { success: false, error: "Can't delete a category that still has items or sub-categories in it" }
    }
}

export async function createSubCategory(data: unknown) {
    const gate = await requireAdmin()
    if (!gate.success) return gate

    const parsed = subCategorySchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: formatZodError(parsed.error) }
    }

    try {
        await prisma.subCategory.create({ data: parsed.data })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to create sub-category:", error)
        return { success: false, error: "Failed to create sub-category" }
    }
}

export async function deleteSubCategory(id: string) {
    const gate = await requireAdmin()
    if (!gate.success) return gate

    try {
        await prisma.subCategory.delete({ where: { id } })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to delete sub-category:", error)
        return { success: false, error: "Can't delete a sub-category that still has items in it" }
    }
}
