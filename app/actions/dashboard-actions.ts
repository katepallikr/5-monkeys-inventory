"use server"

import { prisma } from "@/lib/prisma"

export async function getDashboardStats() {
    // 1. Total Inventory Value
    // This is expensive if we do it in JS, but SQLite sum is fast-ish.
    // Ideally we'd do a raw query but Prisma aggregate is fine.

    // We can't sum (onHand * cost) directly in Prisma aggregate easily without raw query or iterating.
    // Iterating all active items for now. If scaling issue, switch to Raw Query.
    const allItems = await prisma.item.findMany({
        where: { active: true },
        select: { onHand: true, cost: true, minPar: true, name: true, unitType: true, id: true }
    })

    const totalValue = allItems.reduce((sum, item) => {
        return sum + (item.onHand * item.cost)
    }, 0)

    // 2. Low Stock Items
    const lowStockItems = allItems.filter(i => i.minPar > 0 && i.onHand <= i.minPar)

    // 3. Active POs
    const activePOs = await prisma.purchaseOrder.findMany({
        where: { status: { not: 'CLOSED' } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { vendor: true }
    })

    // 4. Open Count Sessions
    const openCounts = await prisma.countSession.findMany({
        where: { status: 'OPEN' },
        take: 5,
        orderBy: { startedAt: 'desc' },
        include: { user: true }
    })

    return {
        totalValue,
        lowStockItems: lowStockItems.slice(0, 5), // Top 5 critical
        lowStockCount: lowStockItems.length,
        activePOs,
        openCounts
    }
}
