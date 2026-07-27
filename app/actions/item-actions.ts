"use server"

import { prisma } from "@/lib/prisma"
import { Item, Category, SubCategory, Vendor } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { itemSchema, formatZodError } from "@/lib/schemas"

export type ItemWithRelations = Item & {
    category: Category
    subCategory: SubCategory | null
    preferredVendor: Vendor | null
}

export async function getItems(): Promise<ItemWithRelations[]> {
    try {
        const items = await prisma.item.findMany({
            include: {
                category: true,
                subCategory: true,
                preferredVendor: true,
            },
            orderBy: {
                name: 'asc'
            }
        })
        return items
    } catch (error) {
        console.error("Failed to fetch items:", error)
        return []
    }
}

export async function deleteItem(id: string) {
    try {
        await prisma.item.delete({ where: { id } })
        revalidatePath('/catalog')
        return { success: true }
    } catch (error) {
        console.error("Failed to delete item:", error)
        return { success: false, error: "Failed to delete item" }
    }
}

export async function getFormData() {
    const [categories, vendors] = await Promise.all([
        prisma.category.findMany({ include: { subCategories: true } }),
        prisma.vendor.findMany({ where: { active: true } })
    ])
    return { categories, vendors }
}

export async function createItem(data: unknown) {
    const parsed = itemSchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: formatZodError(parsed.error) }
    }

    try {
        const { categoryId, subCategoryId, ...rest } = parsed.data

        await prisma.item.create({
            data: {
                ...rest,
                categoryId,
                subCategoryId: subCategoryId || null,
            }
        })
        revalidatePath('/catalog')
        return { success: true }
    } catch (error) {
        console.error("Failed to create item:", error)
        return { success: false, error: "Failed to create item" }
    }
}
