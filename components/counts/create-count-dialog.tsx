"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCountSession } from "@/app/actions/count-actions"
import { getCurrentUser } from "@/app/actions/auth-actions"
import { Plus } from "lucide-react"
import { ItemType } from "@prisma/client"
import { toast } from "sonner"

export function CreateCountDialog() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(`Count - ${new Date().toLocaleDateString()}`)
    const [type, setType] = useState<ItemType | "FULL">("FULL")
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        setLoading(true)
        const user = await getCurrentUser()
        if (!user) {
            toast.error("You must be logged in to start a count")
            setLoading(false)
            return
        }
        const res = await createCountSession(name, type, user.id)
        setLoading(false)
        if (res.success) {
            setOpen(false)
        } else {
            toast.error(res.error || "Failed to create session")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Start New Count
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Start Inventory Count</DialogTitle>
                    <DialogDescription>Select the area you want to count.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Session Name</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Area Type</Label>
                        <Select value={type} onValueChange={(val) => setType(val as ItemType | "FULL")}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FULL">Full Inventory</SelectItem>
                                <SelectItem value="BAR">Bar Only</SelectItem>
                                <SelectItem value="KITCHEN">Kitchen Only</SelectItem>
                                <SelectItem value="HOOKAH">Hookah Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Creating..." : "Start Count"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
