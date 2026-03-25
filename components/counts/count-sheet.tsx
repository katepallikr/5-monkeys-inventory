"use client"

import { Category, SubCategory, Item } from "@prisma/client"
import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Loader2 } from "lucide-react"
import { saveCount, submitSession } from "@/app/actions/count-actions"
import { toast } from "sonner" // Assuming we'll add sonner later, or just alert

type ItemWithCats = Item & { category: Category, subCategory: SubCategory | null }

interface CountSheetProps {
    sessionId: string
    items: ItemWithCats[]
    initialCounts: Record<string, number | null>
    sessionStatus: string
}

export function CountSheet({ sessionId, items, initialCounts, sessionStatus }: CountSheetProps) {
    const [counts, setCounts] = useState<Record<string, number | null>>(initialCounts)
    const [search, setSearch] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [savingId, setSavingId] = useState<string | null>(null)

    // Group items by Location -> Category -> Subcategory
    // OR just Category -> Subcategory as requested
    // Let's do Category First for clarity

    const filteredItems = useMemo(() => {
        return items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    }, [items, search])

    const grouped = useMemo(() => {
        const groups: Record<string, ItemWithCats[]> = {}
        for (const item of filteredItems) {
            const key = item.category.name
            if (!groups[key]) groups[key] = []
            groups[key].push(item)
        }
        return groups
    }, [filteredItems])

    const handleCountChange = async (itemId: string, val: string) => {
        const num = parseFloat(val)
        if (isNaN(num)) return

        setCounts(prev => ({ ...prev, [itemId]: num }))

        // Auto-save logic (debounced ideally, but direct for now)
        setSavingId(itemId)
        await saveCount(sessionId, itemId, num)
        setSavingId(null)
    }

    const handleSubmit = async () => {
        // if (!window.confirm("Are you sure you want to finalize this count? This will update live inventory.")) return

        setSubmitting(true)
        try {
            const res = await submitSession(sessionId)
            if (res.success) {
                toast.success("Count submitted successfully")
                window.location.href = '/counts'
            } else {
                toast.error("Failed to submit count")
                setSubmitting(false)
            }
        } catch (error) {
            toast.error("An error occurred")
            setSubmitting(false)
        }
    }

    const isReadOnly = sessionStatus !== 'OPEN'

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-lg sticky top-0 z-10 backdrop-blur-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search items..."
                        className="pl-8 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {!isReadOnly && (
                    <Button onClick={handleSubmit} disabled={submitting}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Count
                    </Button>
                )}
            </div>

            <div className="space-y-8">
                {Object.entries(grouped).map(([category, catItems]) => (
                    <div key={category} className="space-y-2">
                        <h3 className="font-bold text-lg border-b pb-1 text-primary">{category}</h3>
                        <div className="grid gap-2">
                            {catItems.map(item => (
                                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground flex gap-2">
                                            <Badge variant="outline" className="text-[10px]">{item.unitType}</Badge>
                                            {item.storageLocation && <span>{item.storageLocation}</span>}
                                            {item.subCategory && <span>• {item.subCategory.name}</span>}
                                        </div>
                                    </div>
                                    <div className="w-24 text-right relative">
                                        <Input
                                            type="number"
                                            className="text-right font-mono"
                                            placeholder="-"
                                            value={counts[item.id] ?? ""}
                                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                                            disabled={isReadOnly}
                                        />
                                        {savingId === item.id && (
                                            <div className="absolute right-2 top-2.5">
                                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
