"use client"

import { ColumnDef } from "@tanstack/react-table"
import { ItemWithRelations } from "@/app/actions/item-actions"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export const columns: ColumnDef<ItemWithRelations>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Item Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => <div className="font-medium ml-4">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "category.name",
        header: "Category",
        cell: ({ row }) => {
            const type = row.original.type
            let color = "secondary" as "secondary" | "default" | "destructive" | "outline"
            if (type === "KITCHEN") color = "outline"
            if (type === "BAR") color = "default"
            if (type === "HOOKAH") color = "secondary"

            return (
                <div className="flex items-center gap-2">
                    <Badge variant={color} className="text-[10px]">{type}</Badge>
                    <span>{row.original.category.name}</span>
                </div>
            )
        }
    },
    {
        accessorKey: "onHand",
        header: "On Hand",
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("onHand"))
            const unit = row.original.unitType
            const minPar = row.original.minPar
            const isLow = amount < minPar

            return (
                <div className={isLow ? "text-red-500 font-bold" : ""}>
                    {amount} {unit}
                </div>
            )
        }
    },
    {
        accessorKey: "storageLocation",
        header: "Location",
    },
    {
        accessorKey: "preferredVendor.name",
        header: "Vendor",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const item = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(item.id)}
                        >
                            Copy Item ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Edit Item</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete Item</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
