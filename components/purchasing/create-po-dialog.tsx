"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { createPO } from "@/app/actions/purchasing-actions"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Vendor } from "@prisma/client"
import { useRouter } from "next/navigation"

export function CreatePODialog({ vendors }: { vendors: Vendor[] }) {
    const [open, setOpen] = useState(false)
    const [vendorId, setVendorId] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit() {
        if (!vendorId) return
        setLoading(true)
        const res = await createPO(vendorId)
        setLoading(false)
        if (res.success && res.id) {
            setOpen(false)
            toast.success("PO Created")
            router.push(`/purchasing/${res.id}`)
        } else {
            toast.error("Failed to create PO")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> New Order
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Select Vendor</Label>
                        <Select value={vendorId} onValueChange={setVendorId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Vendor" />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map(v => (
                                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                        Create & Add Items
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
