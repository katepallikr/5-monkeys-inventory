import { getItems, getFormData } from "@/app/actions/item-actions"
import { DataTable } from "@/components/catalog/data-table"
import { columns } from "@/components/catalog/columns"
import { ItemDialog } from "@/components/catalog/item-dialog"

export const dynamic = "force-dynamic"

export default async function CatalogPage() {
    const [data, formData] = await Promise.all([
        getItems(),
        getFormData()
    ])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory Catalog</h2>
                    <p className="text-muted-foreground">Manage your master inventory list for Kitchen, Bar, and Hookah.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <ItemDialog categories={formData.categories} vendors={formData.vendors} />
                </div>
            </div>
            <DataTable columns={columns} data={data} searchKey="name" />
        </div>
    )
}
