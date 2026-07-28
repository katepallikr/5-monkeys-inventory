"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/app/actions/auth-actions"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    ArrowDownToLine,
    ChefHat,
    ShoppingCart,
    Store,
    FileBarChart,
    Settings,
    LogOut,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Package, label: "Catalog", href: "/catalog" },
    { icon: ClipboardList, label: "Counts", href: "/counts" },
    { icon: ArrowDownToLine, label: "Sales Import", href: "/sales" },
    { icon: ChefHat, label: "Recipes", href: "/recipes" },
    { icon: ShoppingCart, label: "Purchasing", href: "/purchasing" },
    { icon: Store, label: "Vendors", href: "/vendors" },
    { icon: FileBarChart, label: "Reports", href: "/reports/variance" },
    { icon: Settings, label: "Settings", href: "/settings" },
]

export function Sidebar({ className }: { className?: string }) {
    const pathname = usePathname()

    return (
        <div className={cn("h-screen flex-col border-r bg-background", className)}>
            <ScrollArea className="flex-1">
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight gradient-text">
                            5 Monkeys Inventory
                        </h2>
                        <div className="space-y-1">
                            {sidebarItems.map((item) => (
                                <Button
                                    key={item.href}
                                    variant={pathname === item.href ? "secondary" : "ghost"}
                                    className={cn(
                                        "w-full justify-start",
                                        pathname === item.href && "bg-secondary"
                                    )}
                                    asChild
                                >
                                    <Link href={item.href}>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.label}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>
            <div className="border-t p-4">
                <Button
                    variant="outline"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                    onClick={() => logout()}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}
