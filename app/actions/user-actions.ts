"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { userSchema, setPinSchema, formatZodError } from "@/lib/schemas"
import { requireAdmin } from "@/app/actions/auth-actions"

export async function getUsers() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, role: true, createdAt: true, pinHash: true },
            orderBy: { name: "asc" },
        })
        // Report whether a PIN is set without ever sending the hash itself.
        return users.map(({ pinHash, ...rest }) => ({ ...rest, hasPin: !!pinHash }))
    } catch (error) {
        console.error("Failed to fetch users:", error)
        return []
    }
}

export async function createUser(data: unknown) {
    const gate = await requireAdmin()
    if (!gate.success) return gate

    const parsed = userSchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: formatZodError(parsed.error) }
    }

    try {
        await prisma.user.create({ data: parsed.data })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to create user:", error)
        return { success: false, error: "Failed to create user (email may already be in use)" }
    }
}

export async function updateUser(id: string, data: unknown) {
    const gate = await requireAdmin()
    if (!gate.success) return gate

    const parsed = userSchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: formatZodError(parsed.error) }
    }

    try {
        await prisma.user.update({ where: { id }, data: parsed.data })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to update user:", error)
        return { success: false, error: "Failed to update user (email may already be in use)" }
    }
}

export async function resetPin(data: unknown) {
    const gate = await requireAdmin()
    if (!gate.success) return gate

    const parsed = setPinSchema.safeParse(data)
    if (!parsed.success) {
        return { success: false, error: formatZodError(parsed.error) }
    }

    try {
        const pinHash = await bcrypt.hash(parsed.data.pin, 10)
        await prisma.user.update({ where: { id: parsed.data.userId }, data: { pinHash } })
        revalidatePath("/settings")
        return { success: true }
    } catch (error) {
        console.error("Failed to reset PIN:", error)
        return { success: false, error: "Failed to reset PIN" }
    }
}
