import { getCountSessions } from "@/app/actions/count-actions"
import { CreateCountDialog } from "@/components/counts/create-count-dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CountsPage() {
    const sessions = await getCountSessions()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Inventory Counts</h2>
                    <p className="text-muted-foreground">Manage physical inventory counts.</p>
                </div>
                <CreateCountDialog />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sessions.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        No count sessions found. Start a new one to begin tracking inventory.
                    </div>
                )}
                {sessions.map(session => (
                    <Card key={session.id} className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <CardTitle>{session.name}</CardTitle>
                                    <CardDescription>{format(new Date(session.startedAt), 'PPP')}</CardDescription>
                                </div>
                                <Badge variant={session.status === 'OPEN' ? 'default' : 'secondary'}>
                                    {session.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-sm text-muted-foreground">
                                    Type: <span className="font-medium text-foreground">{session.type || "Full Inventory"}</span>
                                </div>
                                <Button size="sm" variant="outline" asChild>
                                    <Link href={`/counts/${session.id}`}>
                                        Open <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                        {session.status === 'OPEN' && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                        )}
                    </Card>
                ))}
            </div>
        </div>
    )
}
