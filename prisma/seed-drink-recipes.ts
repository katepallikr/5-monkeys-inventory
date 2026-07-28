/**
 * Sets up Recipe -> RecipeIngredient mappings for drink menu items that have an
 * unambiguous, single-match catalog item, so sales imports automatically deplete
 * inventory for them instead of just creating an empty placeholder recipe.
 *
 * Only covers items that don't require a judgment call (which brand a "well"
 * pour uses, which cocktails' ingredient ratios are, draft vs. bottle for beers
 * tracked as KEG). Run again after adding more items - it upserts by recipe name
 * so it's safe to re-run.
 *
 * Usage: npx tsx prisma/seed-drink-recipes.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OZ_PER_ML = 1 / 29.5735

// Recipe name MUST exactly match the "Item"/"Menu Item" column value from the
// sales report CSV - that's the string importSales() looks up by.
interface DrinkMapping {
    recipeName: string
    catalogItemName: string
    // For bottle-tracked spirits: pour size in oz is converted to a fraction of
    // a bottle using the catalog item's bottleVolumeMl. For items sold as a
    // whole sealed unit (canned beer/RTD tracked as EACH/BOTTLE), pass qty 1
    // directly instead.
    wholeUnitsPerSale?: number
}

const mappings: DrinkMapping[] = [
    // Bottled/canned beer & RTD - 1 unit sold depletes 1 tracked unit
    { recipeName: 'Firestone 805', catalogItemName: 'Firestone Walker 805', wholeUnitsPerSale: 1 },
    { recipeName: 'Electric JellyFish IPA', catalogItemName: 'Pinhouse Electric Jellyfish IPA', wholeUnitsPerSale: 1 },
    { recipeName: 'Guinness', catalogItemName: 'Guinness', wholeUnitsPerSale: 1 },
    { recipeName: 'BTL Dos equis', catalogItemName: 'Dos Equis', wholeUnitsPerSale: 1 },
    { recipeName: 'Bluemoon', catalogItemName: 'Blue Moon', wholeUnitsPerSale: 1 },
    { recipeName: 'Btl Miller Lite', catalogItemName: 'Miller Light', wholeUnitsPerSale: 1 },
    { recipeName: 'Nutrl', catalogItemName: 'Nutrl', wholeUnitsPerSale: 1 },

    // Spirits poured as a shot from a bottle - depletes a fraction of a bottle
    // based on the catalog item's own pourSizeOz/bottleVolumeMl.
    { recipeName: 'Jager Meister', catalogItemName: 'Jagermeister' },
    { recipeName: 'Rumple', catalogItemName: 'Rumple Minze' },
    { recipeName: 'Don julio silver', catalogItemName: 'Don Julio Silver' },
    { recipeName: 'Patron Silver', catalogItemName: 'Patrón Silver' },
    { recipeName: 'Patron Reposado', catalogItemName: 'Patrón Reposado' },
    { recipeName: 'Lalo', catalogItemName: 'Lalo' },
    { recipeName: 'Titos', catalogItemName: 'Tito’s Handmade Vodka' },
    { recipeName: 'Grey goose', catalogItemName: 'Grey Goose' },
    { recipeName: 'Jameson Irish', catalogItemName: 'Jameson Irish' },
]

async function main() {
    for (const m of mappings) {
        const item = await prisma.item.findFirst({ where: { name: m.catalogItemName } })
        if (!item) {
            console.log(`SKIP "${m.recipeName}": catalog item "${m.catalogItemName}" not found`)
            continue
        }

        let quantity: number
        if (m.wholeUnitsPerSale !== undefined) {
            quantity = m.wholeUnitsPerSale
        } else {
            if (!item.pourSizeOz || !item.bottleVolumeMl) {
                console.log(`SKIP "${m.recipeName}": "${m.catalogItemName}" is missing pourSizeOz/bottleVolumeMl`)
                continue
            }
            const bottleOz = item.bottleVolumeMl * OZ_PER_ML
            quantity = item.pourSizeOz / bottleOz
        }

        let recipe = await prisma.recipe.findFirst({ where: { name: m.recipeName } })
        if (!recipe) {
            recipe = await prisma.recipe.create({ data: { name: m.recipeName, category: 'Bar' } })
        }

        const existingIngredient = await prisma.recipeIngredient.findFirst({
            where: { recipeId: recipe.id, itemId: item.id },
        })

        if (existingIngredient) {
            await prisma.recipeIngredient.update({
                where: { id: existingIngredient.id },
                data: { quantity, unit: item.unitType },
            })
        } else {
            await prisma.recipeIngredient.create({
                data: { recipeId: recipe.id, itemId: item.id, quantity, unit: item.unitType },
            })
        }

        console.log(`OK "${m.recipeName}" -> "${m.catalogItemName}" (${quantity.toFixed(4)} ${item.unitType}/sale)`)
    }

    await prisma.$disconnect()
}

main().catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})
