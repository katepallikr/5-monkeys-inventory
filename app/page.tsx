import { getDashboardStats } from "@/app/actions/dashboard-actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DollarSign, AlertTriangle, ShoppingCart, ClipboardList, ArrowRight, Package } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your inventory status.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/counts">
              <ClipboardList className="mr-2 h-4 w-4" /> Start Count
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/purchasing">
              <ShoppingCart className="mr-2 h-4 w-4" /> New Order
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">Estimated based on Last Cost</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">Items below Par Level</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active POs</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePOs.length}</div>
            <p className="text-xs text-muted-foreground">Pending Receiving</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Counts</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openCounts.length}</div>
            <p className="text-xs text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Low Stock List */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Low Stock Items</CardTitle>
            <CardDescription>Critically low items that need reordering.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.lowStockItems.length === 0 && (
                <p className="text-muted-foreground text-sm">Inventory levels are healthy.</p>
              )}
              {stats.lowStockItems.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/10 p-2 rounded-full">
                      <Package className="h-4 w-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        On Hand: {item.onHand} {item.unitType} (Min: {item.minPar})
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/purchasing">Order</Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Open POs */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Pending Receiving</CardTitle>
            <CardDescription>Expected deliveries.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.activePOs.length === 0 && (
                <p className="text-muted-foreground text-sm">No pending orders.</p>
              )}
              {stats.activePOs.map(po => (
                <div key={po.id} className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{po.vendor.name}</span>
                    <span className="text-xs text-muted-foreground">{format(po.createdAt, 'MMM d')} • ${po.totalCost.toFixed(2)}</span>
                  </div>
                  <Badge variant="outline">{po.status}</Badge>
                </div>
              ))}
              {stats.activePOs.length > 0 && (
                <Button variant="link" size="sm" className="w-full mt-2" asChild>
                  <Link href="/purchasing">View All <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
