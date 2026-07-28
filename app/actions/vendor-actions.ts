"use server"

import { prisma } from "@/lib/prisma"
import { Vendor } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { vendorSchema, formatZodError } from "@/lib/schemas"

export type VendorWithCounts = Vendor & {
    _count: { items: number; purchaseOrders: number }
}

export async function getVendors(): Promise<VendorWithCounts[]> {
    try {
        return await prisma.vendor.findMany({
            include: { _count: { select: { items: true, purchaseOrders: true } } },
            orderBy: { name: "asc" },
        })
    } catch (error) {
        console.error("Failed to fetch vendors:", error)
        return []
    }
}

export async function getVendor(id: string) {
    try {
        return await prisma.vendor.findUnique({
            where: { id },
            include: {
                items: { orderBy: { name: "asc" } },
                purchaseOrders: { orderBy: { createdAt: "desc" }, take: 20 },
            },
        })
    } catch (error) {
        console.error("Failed to fetch vendor:", error)
        return null
    }
}

export async function createVendor(data: unknown) {
    const parsed = vendorSchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: formatZodError(parsed.error) }
    }

    try {
        await prisma.vendor.create({
            data: {
                name: parsed.data.name,
                contact: parsed.data.contact || null,
                email: parsed.data.email || null,
                phone: parsed.data.phone || null,
            },
        })
        revalidatePath("/vendors")
        return { success: true }
    } catch (error) {
        console.error("Failed to create vendor:", error)
        return { success: false, error: "Failed to create vendor" }
    }
}

export async function updateVendor(id: string, data: unknown) {
    const parsed = vendorSchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: formatZodError(parsed.error) }
    }

    try {
        await prisma.vendor.update({
            where: { id },
            data: {
                name: parsed.data.name,
                contact: parsed.data.contact || null,
                email: parsed.data.email || null,
                phone: parsed.data.phone || null,
            },
        })
        revalidatePath("/vendors")
        revalidatePath(`/vendors/${id}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update vendor:", error)
        return { success: false, error: "Failed to update vendor" }
    }
}

export async function setVendorActive(id: string, active: boolean) {
    try {
        await prisma.vendor.update({ where: { id }, data: { active } })
        revalidatePath("/vendors")
        revalidatePath(`/vendors/${id}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to update vendor status:", error)
        return { success: false, error: "Failed to update vendor status" }
    }
}
