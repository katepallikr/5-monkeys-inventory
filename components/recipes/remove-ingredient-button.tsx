"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { removeIngredient } from "@/app/actions/recipe-actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function RemoveIngredientButton({ id }: { id: string }) {
    const router = useRouter()

    const handleRemove = async () => {
        if (!confirm("Remove ingredient?")) return
        const res = await removeIngredient(id)
        if (res.success) {
            toast.success("Removed")
            router.refresh()
        }
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleRemove}>
            <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
    )
}
