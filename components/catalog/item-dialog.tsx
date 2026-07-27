"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ItemForm } from "./item-form"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Category, SubCategory, Vendor } from "@prisma/client"

interface ItemDialogProps {
    categories: (Category & { subCategories: SubCategory[] })[]
    vendors: Vendor[]
}

export function ItemDialog({ categories, vendors }: ItemDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Inventory Item</DialogTitle>
                    <DialogDescription>
                        Create a new item in your master catalog.
                    </DialogDescription>
                </DialogHeader>
                <ItemForm
                    categories={categories}
                    vendors={vendors}
                    onSuccess={() => setOpen(false)}
                />
            </DialogContent>
        </Dialog>
    )
}
