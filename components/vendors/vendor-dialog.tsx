"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { VendorForm } from "./vendor-form"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Pencil } from "lucide-react"
import { Vendor } from "@prisma/client"

interface VendorDialogProps {
    vendor?: Vendor
}

export function VendorDialog({ vendor }: VendorDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {vendor ? (
                    <Button variant="outline" size="sm">
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Vendor
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{vendor ? "Edit Vendor" : "Add Vendor"}</DialogTitle>
                    <DialogDescription>
                        {vendor ? "Update this vendor's contact info." : "Create a new vendor to order from."}
                    </DialogDescription>
                </DialogHeader>
                <VendorForm vendor={vendor} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
