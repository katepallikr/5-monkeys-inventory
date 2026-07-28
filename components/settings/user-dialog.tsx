"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { UserForm } from "./user-form"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Pencil } from "lucide-react"
import { Role } from "@prisma/client"

interface UserDialogProps {
    user?: { id: string; name: string; email: string; role: Role }
}

export function UserDialog({ user }: UserDialogProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {user ? (
                    <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                    </Button>
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Staff
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit Staff Account" : "Add Staff Account"}</DialogTitle>
                    <DialogDescription>
                        {user ? "Update this staff member's info." : "New staff accounts start without a PIN - set one after creating."}
                    </DialogDescription>
                </DialogHeader>
                <UserForm user={user} onSuccess={() => setOpen(false)} />
            </DialogContent>
        </Dialog>
    )
}
