"use client"

import { ColumnDef } from "@tanstack/react-table"
import { VendorWithCounts, setVendorActive } from "@/app/actions/vendor-actions"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import Link from "next/link"

async function toggleActive(id: string, active: boolean) {
    const res = await setVendorActive(id, active)
    if (res.success) {
        toast.success(active ? "Vendor reactivated" : "Vendor deactivated")
    } else {
        toast.error(res.error || "Failed to update vendor")
    }
}

export const columns: ColumnDef<VendorWithCounts>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Vendor
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <Link href={`/vendors/${row.original.id}`} className="font-medium ml-4 hover:underline">
                {row.getValue("name")}
            </Link>
        ),
    },
    {
        accessorKey: "contact",
        header: "Contact",
        cell: ({ row }) => row.original.contact || <span className="text-muted-foreground">—</span>,
    },
    {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email || <span className="text-muted-foreground">—</span>,
    },
    {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone || <span className="text-muted-foreground">—</span>,
    },
    {
        id: "items",
        header: "Items",
        cell: ({ row }) => row.original._count.items,
    },
    {
        accessorKey: "active",
        header: "Status",
        cell: ({ row }) => {
            const active = row.original.active
            return (
                <Badge
                    variant={active ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => toggleActive(row.original.id, !active)}
                >
                    {active ? "Active" : "Inactive"}
                </Badge>
            )
        },
    },
]
