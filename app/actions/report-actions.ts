"use server"

import { prisma } from "@/lib/prisma"

export async function getCompletedSessions() {
    return await prisma.countSession.findMany({
        where: { status: "COMPLETED" },
        orderBy: { completedAt: 'desc' },
        include: { user: true }
    })
}

export async function getVarianceReport(sessionId: string) {
    const session = await prisma.countSession.findUnique({
        where: { id: sessionId },
        include: {
            user: true,
            items: {
                include: {
                    item: {
                        include: { category: true }
                    }
                }
            }
        }
    })

    if (!session) return null

    // Calculate variations
    const reportItems = session.items.map(i => {
        const expected = i.expectedOnHand
        const actual = i.counted || 0
        const variance = actual - expected
        const cost = i.item.cost || 0
        const varianceValue = variance * cost

        return {
            itemId: i.itemId,
            name: i.item.name,
            category: i.item.category.name,
            unit: i.item.unitType,
            expected,
            actual,
            variance,
            cost,
            varianceValue
        }
    })

    const totalVarianceValue = reportItems.reduce((acc, curr) => acc + curr.varianceValue, 0)
    const totalItemsCounted = reportItems.length
    const itemsWithVariance = reportItems.filter(i => i.variance !== 0).length

    return {
        session,
        items: reportItems,
        summary: {
            totalVarianceValue,
            totalItemsCounted,
            itemsWithVariance
        }
    }
}
