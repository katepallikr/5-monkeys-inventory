import { getRecipe } from "@/app/actions/recipe-actions"
import { getItems } from "@/app/actions/item-actions"
import { notFound } from "next/navigation"
import { IngredientForm } from "@/components/recipes/ingredient-form"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RemoveIngredientButton } from "@/components/recipes/remove-ingredient-button"

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const recipe = await getRecipe(id)
    if (!recipe) return notFound()

    const allItems = await getItems() // Full catalog for selection

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">{recipe.name}</h2>
                <p className="text-muted-foreground">Ingredients depleted when this item is sold.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Ingredients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {recipe.ingredients.length === 0 && (
                        <div className="text-sm text-muted-foreground italic">No ingredients linked.</div>
                    )}
                    {recipe.ingredients.map(ing => (
                        <div key={ing.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                            <div>
                                <div className="font-medium">{ing.item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    {ing.quantity} {ing.unit}
                                </div>
                            </div>
                            <RemoveIngredientButton id={ing.id} />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Add Ingredient</CardTitle>
                </CardHeader>
                <CardContent>
                    <IngredientForm recipeId={recipe.id} items={allItems} />
                </CardContent>
            </Card>
        </div>
    )
}
