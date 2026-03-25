"use client"

import { PurchaseOrder, PurchaseOrderItem, Vendor, Item, Category } from "@prisma/client"
import { ItemWithRelations } from "@/app/actions/item-actions"
import { addPOItem, receivePO } from "@/app/actions/purchasing-actions"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { CheckCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"

type POWithRelations = PurchaseOrder & {
    vendor: Vendor
    items: (PurchaseOrderItem & { item: Item })[]
}

interface POBuilderProps {
    po: POWithRelations
    allItems: ItemWithRelations[]
}

export function POBuilder({ po, allItems }: POBuilderProps) {
    const [selectedItemId, setSelectedItemId] = useState("")
    const [quantity, setQuantity] = useState("")
    const [cost, setCost] = useState("")
    const [adding, setAdding] = useState(false)
    const [receiving, setReceiving] = useState(false)

    // Filter items to preferably show this vendor's items first, or all
    // For now simple list

    async function handleAddItem() {
        if (!selectedItemId || !quantity || !cost) return
        setAdding(true)
        const res = await addPOItem(po.id, selectedItemId, parseFloat(quantity), parseFloat(cost))
        setAdding(false)
        if (res.success) {
            setSelectedItemId("")
            setQuantity("")
            // Keep cost? Or clear? Clear for valid logic
            setCost("")
            toast.success("Item added")
        } else {
            toast.error("Failed to add item")
        }
    }

    async function handleReceive() {
        // if (!confirm("Receive this order? Inventory will be updated.")) return
        setReceiving(true)
        const res = await receivePO(po.id)
        setReceiving(false)
        if (res.success) {
            toast.success("Order Received!")
            // Force refresh or redirect? The revalidatePath should update status badge ui
        } else {
            toast.error("Failed to receive")
        }
    }

    const isClosed = po.status === 'CLOSED' || po.status === 'CANCELLED'

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Purchase Order #{po.id.slice(0, 8)}</h2>
                    <p className="text-muted-foreground">Vendor: {po.vendor.name} • {format(new Date(po.createdAt), 'PPP')}</p>
                </div>
                <div className="flex items-center gap-4">
                    <Badge className="text-lg px-4 py-1" variant={po.status === 'CLOSED' ? 'outline' : 'default'}>
                        {po.status}
                    </Badge>
                    {!isClosed && (
                        <Button onClick={handleReceive} disabled={receiving || po.items.length === 0} variant="secondary">
                            {receiving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <CheckCircle className="mr-2 h-4 w-4" /> Receive Order
                        </Button>
                    )}
                </div>
            </div>

            {!isClosed && (
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-sm">Add Item to Order</CardTitle>
                    </CardHeader>
                    <CardContent className="flex gap-4">
                        <div className="flex-1">
                            <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Item..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {allItems.map(i => (
                                        <SelectItem key={i.id} value={i.id}>
                                            {i.name} ({i.unitType}) - Curr: {i.onHand}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Input
                            className="w-24"
                            type="number"
                            placeholder="Qty"
                            value={quantity}
                            onChange={e => setQuantity(e.target.value)}
                        />
                        <Input
                            className="w-24"
                            type="number"
                            placeholder="Cost ($)"
                            value={cost}
                            onChange={e => setCost(e.target.value)}
                        />
                        <Button onClick={handleAddItem} disabled={adding}>
                            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                        </Button>
                    </CardContent>
                </Card>
            )}

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Unit Cost</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {po.items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    No items in this order yet.
                                </TableCell>
                            </TableRow>
                        )}
                        {po.items.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <div className="font-medium">{item.item.name}</div>
                                    <div className="text-xs text-muted-foreground">{item.item.unitType}</div>
                                </TableCell>
                                <TableCell className="text-right">{item.quantity}</TableCell>
                                <TableCell className="text-right">${item.unitCost.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-bold">
                                    ${(item.quantity * item.unitCost).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="p-4 border-t flex justify-end">
                    <div className="text-xl font-bold">
                        Total: ${po.totalCost.toFixed(2)}
                    </div>
                </div>
            </Card>
        </div>
    )
}
