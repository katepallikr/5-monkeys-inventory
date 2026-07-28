"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KeyRound, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { resetPin } from "@/app/actions/user-actions"

export function ResetPinDialog({ userId, userName }: { userId: string; userName: string }) {
    const [open, setOpen] = useState(false)
    const [pin, setPin] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        const res = await resetPin({ userId, pin })
        setLoading(false)
        if (res.success) {
            toast.success(`PIN reset for ${userName}`)
            setPin("")
            setOpen(false)
        } else {
            toast.error(res.error || "Failed to reset PIN")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                    <KeyRound className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Reset PIN</DialogTitle>
                    <DialogDescription>
                        Set a new 4-6 digit login PIN for {userName}. This replaces their current PIN immediately.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="password"
                        placeholder="New PIN"
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <Button type="submit" className="w-full" disabled={loading || pin.length < 4}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Set New PIN
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
