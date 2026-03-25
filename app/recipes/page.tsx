import { getRecipes, createRecipe } from "@/app/actions/recipe-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Plus, ChevronRight } from "lucide-react"
import { CreateRecipeDialog } from "@/components/recipes/create-recipe-dialog"

export const dynamic = "force-dynamic"

export default async function RecipesPage() {
    const recipes = await getRecipes()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Recipes & Menu Items</h2>
                    <p className="text-muted-foreground">Map POS items to inventory ingredients.</p>
                </div>
                <CreateRecipeDialog />
            </div>

            <div className="rounded-md border bg-card">
                <div className="p-4 grid gap-4">
                    {recipes.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No recipes found. Create one or import sales to auto-generate.
                        </div>
                    )}
                    {recipes.map(recipe => (
                        <div key={recipe.id} className="flex items-center justify-between p-2 hover:bg-accent/50 rounded-lg transition-colors border-b last:border-0">
                            <div className="space-y-1">
                                <div className="font-medium">{recipe.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {recipe._count.ingredients} ingredients
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" asChild>
                                <Link href={`/recipes/${recipe.id}`}>
                                    <ChevronRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
