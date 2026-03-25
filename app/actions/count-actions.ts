"use server"

import { prisma } from "@/lib/prisma"
import { CountSession, ItemType } from "@prisma/client"
import { revalidatePath } from "next/cache"

export async function createCountSession(name: string, type: ItemType | "FULL", userId: string) {
    try {
        const session = await prisma.countSession.create({
            data: {
                name,
                type: type === "FULL" ? null : type as ItemType,
                userId: userId,
                status: "OPEN"
            }
        })
        revalidatePath('/counts')
        return { success: true, id: session.id }
    } catch (error) {
        console.error("Failed to create count session:", error)
        return { success: false, error: "Failed to create session" }
    }
}

export async function getCountSessions() {
    try {
        const sessions = await prisma.countSession.findMany({
            include: {
                user: true,
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { startedAt: 'desc' }
        })
        return sessions
    } catch (error) {
        console.error("Failed to fetch sessions:", error)
        return []
    }
}

export async function getCountSession(id: string) {
    return await prisma.countSession.findUnique({
        where: { id },
        include: {
            user: true
        }
    })
}

export async function getItemsForCount(type: "KITCHEN" | "BAR" | "HOOKAH" | null) {
    return await prisma.item.findMany({
        where: {
            active: true,
            ...(type ? { type } : {})
        },
        include: {
            category: true,
            subCategory: true
        },
        orderBy: [
            { storageLocation: 'asc' },
            { category: { name: 'asc' } },
            { name: 'asc' }
        ]
    })
}

export async function saveCount(sessionId: string, itemId: string, quantity: number) {
    try {
        // Upsert the count item
        const session = await prisma.countSession.findUnique({
            where: { id: sessionId },
            include: { items: true }
        })

        if (!session) return { success: false, error: "Session not found" }
        if (session.status !== 'OPEN') return { success: false, error: "Session is closed" }

        // Find if this item was already counted in this session
        const existing = await prisma.countSessionItem.findFirst({
            where: { sessionId, itemId }
        })

        if (existing) {
            await prisma.countSessionItem.update({
                where: { id: existing.id },
                data: { counted: quantity }
            })
        } else {
            // We need expectedOnHand at the moment of *count*? 
            // Or at moment of session creation? 
            // Usually snapshotting expectedOnHand happens when the count is *finalized* or *started*.
            // For now, let's grab current onHand as expected.
            const item = await prisma.item.findUnique({ where: { id: itemId } })
            await prisma.countSessionItem.create({
                data: {
                    sessionId,
                    itemId,
                    counted: quantity,
                    expectedOnHand: item?.onHand || 0
                }
            })
        }

        revalidatePath(`/counts/${sessionId}`)
        return { success: true }
    } catch (error) {
        console.error("Failed to save count:", error)
        return { success: false }
    }
}

export async function getSessionCounts(sessionId: string) {
    const counts = await prisma.countSessionItem.findMany({
        where: { sessionId }
    })
    // Return as a map for O(1) lookup
    return counts.reduce((acc, curr) => {
        acc[curr.itemId] = curr.counted
        return acc
    }, {} as Record<string, number | null>)
}

export async function submitSession(sessionId: string) {
    const session = await prisma.countSession.findUnique({
        where: { id: sessionId },
        include: { items: { include: { item: true } } }
    })
    if (!session) return { success: false }

    // 1. Transaction to update inventory and close session
    await prisma.$transaction(async (tx) => {
        // Update session status
        await tx.countSession.update({
            where: { id: sessionId },
            data: { status: "COMPLETED", completedAt: new Date() }
        })

        // For each count item, update the main inventory
        // Also create Variance Transaction if needed
        for (const countItem of session.items) {
            const counted = countItem.counted || 0
            // Update Item OnHand
            await tx.item.update({
                where: { id: countItem.itemId },
                data: { onHand: counted }
            })

            // Create Audit Transaction
            const variance = counted - countItem.expectedOnHand
            if (variance !== 0) {
                await tx.transaction.create({
                    data: {
                        type: "COUNT",
                        itemId: countItem.itemId,
                        quantityChange: variance,
                        referenceId: sessionId,
                        reason: `Physical Count Adjustment`
                    }
                })
            }
        }
    })

    revalidatePath('/counts')
    return { success: true }
}
