"use client"

import { Button } from "@/components/ui/button"
import { setVendorActive } from "@/app/actions/vendor-actions"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2 } from "lucide-react"

export function VendorStatusToggle({ id, active }: { id: string; active: boolean }) {
    const [loading, setLoading] = useState(false)

    async function handleClick() {
        if (active && !confirm("Deactivate this vendor? They'll stop showing up as an option when creating new purchase orders or catalog items.")) return

        setLoading(true)
        const res = await setVendorActive(id, !active)
        setLoading(false)
        if (res.success) {
            toast.success(active ? "Vendor deactivated" : "Vendor reactivated")
        } else {
            toast.error(res.error || "Failed to update vendor")
        }
    }

    return (
        <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {active ? "Deactivate" : "Reactivate"}
        </Button>
    )
}
