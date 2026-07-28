import { getVendors } from "@/app/actions/vendor-actions"
import { DataTable } from "@/components/catalog/data-table"
import { columns } from "@/components/vendors/columns"
import { VendorDialog } from "@/components/vendors/vendor-dialog"

export const dynamic = "force-dynamic"

export default async function VendorsPage() {
    const vendors = await getVendors()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
                    <p className="text-muted-foreground">Suppliers you order inventory from.</p>
                </div>
                <VendorDialog />
            </div>
            <DataTable columns={columns} data={vendors} searchKey="name" />
        </div>
    )
}
