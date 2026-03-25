import { getVarianceReport } from "@/app/actions/report-actions"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { format } from "date-fns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function VarianceReportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const report = await getVarianceReport(id)
    if (!report) return notFound()

    const { session, items, summary } = report

    // Sort items by absolute variance value desc
    items.sort((a, b) => Math.abs(b.varianceValue) - Math.abs(a.varianceValue))

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{session.name} - Variance Report</h1>
                <p className="text-muted-foreground">
                    Completed on {session.completedAt ? format(session.completedAt, 'PPP p') : 'N/A'} by {session.user.name}
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Variance Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", summary.totalVarianceValue < 0 ? "text-red-500" : "text-green-500")}>
                            {summary.totalVarianceValue < 0 ? "-" : "+"}${Math.abs(summary.totalVarianceValue).toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">Net financial impact</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Items with Variance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary.itemsWithVariance} / {summary.totalItemsCounted}</div>
                        <p className="text-xs text-muted-foreground">Items matching expected counts: {summary.totalItemsCounted - summary.itemsWithVariance}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Accuracy Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary.totalItemsCounted > 0
                                ? ((1 - (summary.itemsWithVariance / summary.totalItemsCounted)) * 100).toFixed(1)
                                : 100}%
                        </div>
                        <p className="text-xs text-muted-foreground">% of exact matches</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Detailed Breakdown</CardTitle>
                    <CardDescription>Items sorted by highest variance value.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead className="text-right">Expected</TableHead>
                                <TableHead className="text-right">Actual</TableHead>
                                <TableHead className="text-right">Variance</TableHead>
                                <TableHead className="text-right">Unit Cost</TableHead>
                                <TableHead className="text-right">Variance Value</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map(item => (
                                <TableRow key={item.itemId} className={item.variance !== 0 ? "bg-muted/20" : ""}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell className="text-right">{item.expected}</TableCell>
                                    <TableCell className="text-right font-bold">{item.actual}</TableCell>
                                    <TableCell className={cn("text-right font-bold", item.variance < 0 ? "text-red-500" : item.variance > 0 ? "text-green-500" : "")}>
                                        {item.variance > 0 ? "+" : ""}{item.variance} {item.unit}
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground">${item.cost.toFixed(2)}</TableCell>
                                    <TableCell className={cn("text-right font-bold", item.varianceValue < 0 ? "text-red-500" : item.varianceValue > 0 ? "text-green-500" : "")}>
                                        {item.varianceValue > 0 ? "+" : ""}${Math.abs(item.varianceValue).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
