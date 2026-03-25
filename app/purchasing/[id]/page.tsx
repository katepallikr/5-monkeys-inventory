import { getPO, receivePO } from "@/app/actions/purchasing-actions"
import { getItems } from "@/app/actions/item-actions"
import { notFound } from "next/navigation"
import { POBuilder } from "@/components/purchasing/po-builder"

export const dynamic = "force-dynamic"

export default async function PODetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Await params if necessary, though in newer Next.js it's async access but type is simpler
    const { id } = await params
    const po = await getPO(id)
    if (!po) return notFound()

    const allItems = await getItems() // Full catalog for selection

    return (
        <POBuilder po={po} allItems={allItems} />
    )
}
