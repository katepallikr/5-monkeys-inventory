"use client"

import { useState } from "react"
import { Category, SubCategory, ItemType } from "@prisma/client"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { X, Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
    createCategory,
    deleteCategory,
    createSubCategory,
    deleteSubCategory,
} from "@/app/actions/category-actions"

type CategoryWithSub = Category & { subCategories: SubCategory[]; _count: { items: number } }

function AddSubCategoryRow({ categoryId }: { categoryId: string }) {
    const [name, setName] = useState("")
    const [loading, setLoading] = useState(false)

    async function handleAdd() {
        if (!name.trim()) return
        setLoading(true)
        const res = await createSubCategory({ name, categoryId })
        setLoading(false)
        if (res.success) {
            toast.success("Sub-category added")
            setName("")
        } else {
            toast.error(res.error || "Failed to add sub-category")
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Input
                placeholder="New sub-category..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Button size="sm" variant="outline" className="h-8" onClick={handleAdd} disabled={loading}>
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            </Button>
        </div>
    )
}

function CategoryCard({ category }: { category: CategoryWithSub }) {
    async function handleDeleteCategory() {
        if (!confirm(`Delete category "${category.name}"? Only works if it has no items or sub-categories left.`)) return
        const res = await deleteCategory(category.id)
        if (res.success) {
            toast.success("Category deleted")
        } else {
            toast.error(res.error || "Failed to delete category")
        }
    }

    async function handleDeleteSubCategory(id: string, name: string) {
        if (!confirm(`Delete sub-category "${name}"? Only works if no items use it.`)) return
        const res = await deleteSubCategory(id)
        if (res.success) {
            toast.success("Sub-category deleted")
        } else {
            toast.error(res.error || "Failed to delete sub-category")
        }
    }

    return (
        <div className="border rounded-md p-4 space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="outline" className="text-[10px]">{category.type}</Badge>
                    <span className="text-xs text-muted-foreground">{category._count.items} items</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleDeleteCategory}>
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <div className="pl-4 space-y-2">
                {category.subCategories.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between text-sm">
                        <span>{sub.name}</span>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleDeleteSubCategory(sub.id, sub.name)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
                <AddSubCategoryRow categoryId={category.id} />
            </div>
        </div>
    )
}

function AddCategoryForm() {
    const [name, setName] = useState("")
    const [type, setType] = useState<ItemType>("BAR")
    const [loading, setLoading] = useState(false)

    async function handleAdd() {
        if (!name.trim()) return
        setLoading(true)
        const res = await createCategory({ name, type })
        setLoading(false)
        if (res.success) {
            toast.success("Category added")
            setName("")
        } else {
            toast.error(res.error || "Failed to add category")
        }
    }

    return (
        <div className="flex items-center gap-2">
            <Input
                placeholder="New category name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
            <Select value={type} onValueChange={(v) => setType(v as ItemType)}>
                <SelectTrigger className="w-32">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="KITCHEN">Kitchen</SelectItem>
                    <SelectItem value="BAR">Bar</SelectItem>
                    <SelectItem value="HOOKAH">Hookah</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add
            </Button>
        </div>
    )
}

export function CategoryManager({ categories }: { categories: CategoryWithSub[] }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Categories</CardTitle>
                <CardDescription>
                    Manage the Bar/Kitchen/Hookah categories and sub-categories used across the catalog.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <AddCategoryForm />
                <div className="grid gap-3 md:grid-cols-2">
                    {categories.map((c) => (
                        <CategoryCard key={c.id} category={c} />
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
