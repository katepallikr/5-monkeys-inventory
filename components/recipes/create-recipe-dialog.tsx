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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createRecipe } from "@/app/actions/recipe-actions"
import { Plus } from "lucide-react"
import { toast } from "sonner"

export function CreateRecipeDialog() {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleSubmit() {
        if (!name) return
        setLoading(true)
        const res = await createRecipe(name)
        setLoading(false)
        if (res.success) {
            setOpen(false)
            setName("")
            toast.success("Recipe created")
        } else {
            toast.error("Failed to create recipe")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Recipe
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New Recipe / Menu Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>POS Name</Label>
                        <Input
                            placeholder="e.g. Jack Daniels Shot"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                        Create
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
