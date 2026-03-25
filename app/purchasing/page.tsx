import { getPOs } from "@/app/actions/purchasing-actions"
import { CreatePODialog } from "@/components/purchasing/create-po-dialog"
import { ImportPODialog } from "@/components/purchasing/import-po-dialog"
import { getFormData } from "@/app/actions/item-actions" // Reuse to get vendors
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PurchasingPage() {
    const pos = await getPOs()
    const { vendors } = await getFormData()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchasing & Receiving</h2>
                    <p className="text-muted-foreground">Manage orders and incoming stock.</p>
                </div>
                <div className="flex gap-2">
                    <ImportPODialog vendors={vendors} />
                    <CreatePODialog vendors={vendors} />
                </div>
            </div>

            <div className="grid gap-4">
                {pos.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        No purchase orders found. Create one to start ordering.
                    </div>
                )}
                {pos.map(po => (
                    <Card key={po.id}>
                        <div className="flex items-center justify-between p-6">
                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-lg">{po.vendor.name}</div>
                                    <Badge variant={po.status === 'DRAFT' ? 'secondary' : 'default'}>
                                        {po.status}
                                    </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Created {format(new Date(po.createdAt), 'PPP')} • {po._count.items} Items
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="font-bold">${po.totalCost.toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground">Total</div>
                                </div>
                                <Button asChild size="sm">
                                    <Link href={`/purchasing/${po.id}`}>
                                        View <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    )
}
