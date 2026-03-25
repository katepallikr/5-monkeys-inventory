"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function login(pinCode: string) {
    const user = await prisma.user.findFirst({
        where: { pinCode: pinCode }
    })

    if (!user) {
        return { success: false, error: "Invalid PIN" }
    }

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session", user.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    })

    return { success: true }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete("session")
    redirect("/login")
}

export async function getCurrentUser() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("session")?.value

    if (!userId) return null

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
        return user
    } catch (e) {
        return null
    }
}
