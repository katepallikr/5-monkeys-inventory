import { getCompletedSessions } from "@/app/actions/report-actions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { format } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, FileBarChart } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function VarianceListPage() {
    const sessions = await getCompletedSessions()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Variance Reports</h1>
                    <p className="text-muted-foreground">Select a completed count session to view discrepancies.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No completed count sessions found. Complete a count to generate a report.
                    </div>
                )}

                {sessions.map(session => (
                    <Card key={session.id} className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{session.name}</CardTitle>
                                <Badge variant="outline">{session.type || "FULL"}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                <div className="flex justify-between">
                                    <span>Counter:</span>
                                    <span className="font-medium text-foreground">{session.user.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Date:</span>
                                    <span className="font-medium text-foreground">
                                        {session.completedAt ? format(session.completedAt, 'PPP') : 'N/A'}
                                    </span>
                                </div>
                            </div>
                            <Button asChild className="w-full">
                                <Link href={`/reports/variance/${session.id}`}>
                                    View Report <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
