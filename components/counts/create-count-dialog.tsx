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
import { Plus } from "lucide-react"

export function CreateCountDialog() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState(`Count - ${new Date().toLocaleDateString()}`)
    const [type, setType] = useState<string>("FULL")
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        setLoading(true)
        // Hardcoded User ID for now (Admin) since no Auth context yet
        // In prod, this would be current user ID
        const adminId = "b7390c90-81c3-47e2-9c25-c208b5960e14" // From seed
        const res = await createCountSession(name, type as any, adminId)
        setLoading(false)
        if (res.success) {
            setOpen(false)
        } else {
            alert("Failed to create session")
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
                        <Select value={type} onValueChange={setType}>
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
