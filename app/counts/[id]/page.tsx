import { getCountSession, getItemsForCount, getSessionCounts } from "@/app/actions/count-actions"
import { CountSheet } from "@/components/counts/count-sheet"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CountSessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const session = await getCountSession(id)
    if (!session) return notFound()

    const items = await getItemsForCount(session.type as any)
    const currentCounts = await getSessionCounts(session.id)

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between pb-4 border-b">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">{session.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                        <span>{format(new Date(session.startedAt), 'PPP')}</span>
                        <span>•</span>
                        <Badge variant="secondary">{session.type || "Full Inventory"}</Badge>
                        <Badge variant={session.status === 'OPEN' ? 'default' : 'secondary'}>{session.status}</Badge>
                    </div>
                </div>
            </div>

            <CountSheet
                sessionId={session.id}
                items={items}
                initialCounts={currentCounts}
                sessionStatus={session.status}
            />
        </div>
    )
}
