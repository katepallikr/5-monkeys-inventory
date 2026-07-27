"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
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
import { Upload, Loader2, FileUp } from "lucide-react"
import { toast } from "sonner"
import { importPurchaseOrder } from "@/app/actions/purchasing-actions"

interface Vendor {
    id: string
    name: string
    // other fields...
}

export function ImportPODialog({ vendors }: { vendors: Vendor[] }) {
    const [open, setOpen] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [vendorId, setVendorId] = useState("")

    async function handleImport(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!vendorId) {
            toast.error("Please select a vendor")
            return
        }

        const formData = new FormData(e.currentTarget)
        formData.append('vendorId', vendorId) // Ensure vendorId is included

        setUploading(true)
        try {
            const res = await importPurchaseOrder(formData)
            if (res.success) {
                if (res.data && (res.data.unmatchedCount > 0 || res.data.malformedLineCount > 0)) {
                    toast.warning(
                        `PO imported: ${res.data.matchedCount} item(s) matched, ${res.data.unmatchedCount} unmatched, ${res.data.malformedLineCount} malformed line(s) skipped`,
                        { duration: 6000 }
                    )
                } else {
                    toast.success("PO Imported Successfully")
                }
                setOpen(false)
            } else {
                // If it's a duplicate, the error message will say so
                if (res.error?.includes("Duplicate")) {
                    toast.error(res.error, { duration: 5000 })
                } else {
                    toast.error(res.error || "Import failed")
                }
            }
        } catch (error) {
            toast.error("Something went wrong")
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <FileUp className="mr-2 h-4 w-4" /> Import PO (CSV)
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Import Purchase Order</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleImport} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="vendor">Vendor</Label>
                        <Select value={vendorId} onValueChange={setVendorId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Vendor" />
                            </SelectTrigger>
                            <SelectContent>
                                {vendors.map((vendor) => (
                                    <SelectItem key={vendor.id} value={vendor.id}>
                                        {vendor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="file">CSV File from Vendor</Label>
                        <Input id="file" name="file" type="file" accept=".csv" required />
                        <p className="text-xs text-muted-foreground">
                            Supported: Sysco Application Export (CSV)
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...
                                </>
                            ) : (
                                "Upload & Process"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
