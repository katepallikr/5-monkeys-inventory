"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { importSales } from "@/app/actions/sales-actions"
import { toast } from "sonner"
import { Loader2, Upload } from "lucide-react"

interface SalesImportStats {
    processedCount: number
    missingRecipeCount: number
    depletionCount: number
    skippedRowCount: number
    rowErrors: string[]
}

export default function SalesUploadPage() {
    const [uploading, setUploading] = useState(false)
    const [stats, setStats] = useState<SalesImportStats | null>(null)

    async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const file = formData.get('file') as File
        if (!file || file.size === 0) {
            toast.error("Please select a file")
            return
        }

        setUploading(true)
        setStats(null)
        const res = await importSales(formData)
        setUploading(false)

        if (res.success && res.data) {
            setStats(res.data)
            if (res.data.skippedRowCount > 0) {
                toast.warning(`Import complete with ${res.data.skippedRowCount} row(s) skipped`)
            } else {
                toast.success("Import successful!")
            }
        } else {
            toast.error(res.error || "Import failed")
        }
    }

    return (
        <div className="space-y-6 max-w-xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Import Sales Report</h2>
                <p className="text-muted-foreground">Upload PMIX CSV to deplete inventory.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Upload CSV</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpload} className="space-y-4">
                        <Input type="file" name="file" accept=".csv" required />
                        <Button type="submit" className="w-full" disabled={uploading}>
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" /> Import Sales
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {stats && (
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Items Processed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.processedCount}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">New Recipes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-500">{stats.missingRecipeCount}</div>
                            <p className="text-xs text-muted-foreground">Created placeholders</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Items Depleted</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-500">{stats.depletionCount}</div>
                            <p className="text-xs text-muted-foreground">Total Units Sold</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {stats && stats.rowErrors.length > 0 && (
                <Card className="border-destructive/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-destructive">
                            {stats.skippedRowCount} row(s) skipped
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                            {stats.rowErrors.map((err, i) => (
                                <li key={i}>{err}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
