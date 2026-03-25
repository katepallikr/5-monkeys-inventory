"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { addIngredient } from "@/app/actions/recipe-actions"
import { toast } from "sonner"
import { ItemWithRelations } from "@/app/actions/item-actions"

interface IngredientFormProps {
    recipeId: string
    items: ItemWithRelations[]
}

export function IngredientForm({ recipeId, items }: IngredientFormProps) {
    const [selectedItemId, setSelectedItemId] = useState("")
    const [quantity, setQuantity] = useState("")
    const [unit, setUnit] = useState("OZ")
    const [loading, setLoading] = useState(false)

    // Filter items based on search? For now just simple select
    // In real app, use a Combobox (Command)
    // We'll trust the user to scroll for now or implementing basic text search if list is huge

    async function handleSubmit() {
        if (!selectedItemId || !quantity) return
        setLoading(true)
        const res = await addIngredient(recipeId, selectedItemId, parseFloat(quantity), unit)
        setLoading(false)
        if (res.success) {
            setSelectedItemId("")
            setQuantity("")
            toast.success("Ingredient added")
        } else {
            toast.error("Failed")
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select Item" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                        {items.map(i => (
                            <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-2">
                <Input
                    type="number"
                    placeholder="Qty"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                />
                <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="OZ">OZ</SelectItem>
                        <SelectItem value="ML">ML</SelectItem>
                        <SelectItem value="EACH">EACH</SelectItem>
                        <SelectItem value="SHOT">SHOT</SelectItem>
                    </SelectContent>
                </Select>
                <Button onClick={handleSubmit} disabled={loading}>Add</Button>
            </div>
        </div>
    )
}
