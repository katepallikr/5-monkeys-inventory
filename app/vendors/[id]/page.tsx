import { getVendor } from "@/app/actions/vendor-actions"
import { notFound } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VendorDialog } from "@/components/vendors/vendor-dialog"
import { VendorStatusToggle } from "@/components/vendors/vendor-status-toggle"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, ArrowRight, Mail, Phone, User } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const vendor = await getVendor(id)
    if (!vendor) return notFound()

    return (
        <div className="space-y-6">
            <Button asChild variant="ghost" size="sm" className="-ml-2">
                <Link href="/vendors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vendors
                </Link>
            </Button>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold tracking-tight">{vendor.name}</h2>
                    <Badge variant={vendor.active ? "default" : "secondary"}>
                        {vendor.active ? "Active" : "Inactive"}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <VendorStatusToggle id={vendor.id} active={vendor.active} />
                    <VendorDialog vendor={vendor} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2"><User className="h-4 w-4" /> Contact</CardDescription>
                    </CardHeader>
                    <CardContent>{vendor.contact || <span className="text-muted-foreground">Not set</span>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2"><Mail className="h-4 w-4" /> Email</CardDescription>
                    </CardHeader>
                    <CardContent>{vendor.email || <span className="text-muted-foreground">Not set</span>}</CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2"><Phone className="h-4 w-4" /> Phone</CardDescription>
                    </CardHeader>
                    <CardContent>{vendor.phone || <span className="text-muted-foreground">Not set</span>}</CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Purchase Orders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {vendor.purchaseOrders.length === 0 && (
                        <p className="text-sm text-muted-foreground">No purchase orders yet.</p>
                    )}
                    {vendor.purchaseOrders.map((po) => (
                        <div key={po.id} className="flex items-center justify-between border rounded-md p-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <Badge variant={po.status === "DRAFT" ? "secondary" : "default"}>{po.status}</Badge>
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(po.createdAt), "PPP")}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-medium">${po.totalCost.toFixed(2)}</span>
                                <Button asChild size="sm" variant="ghost">
                                    <Link href={`/purchasing/${po.id}`}>
                                        View <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items ({vendor.items.length})</CardTitle>
                    <CardDescription>Catalog items where this is the preferred vendor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                    {vendor.items.length === 0 && (
                        <p className="text-sm text-muted-foreground">No items linked to this vendor.</p>
                    )}
                    {vendor.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                            <span>{item.name}</span>
                            <span className="text-muted-foreground">{item.onHand} {item.unitType}</span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
