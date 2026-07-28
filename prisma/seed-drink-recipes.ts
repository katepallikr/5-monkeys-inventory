/**
 * Sets up Recipe -> RecipeIngredient mappings for drink menu items, so sales
 * imports automatically deplete inventory for them instead of just creating an
 * empty placeholder recipe. Mappings and pour/keg sizes below were confirmed
 * with the business owner, not guessed.
 *
 * Still not covered: specialty cocktails needing an actual recipe card, and
 * items with no catalog match at all (see chat history). Run again after
 * adding more mappings - it's idempotent, safe to re-run.
 *
 * Usage: npx tsx prisma/seed-drink-recipes.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OZ_PER_ML = 1 / 29.5735

// Confirmed with the owner: half-barrel (15.5 gal) kegs, 16oz pint pours.
const KEG_OZ = 15.5 * 128
const PINT_OZ = 16
const KEG_FRACTION_PER_PINT = PINT_OZ / KEG_OZ

// Recipe name MUST exactly match the "Item"/"Menu Item" column value from the
// sales report CSV - that's the string importSales() looks up by.
interface DrinkMapping {
    recipeName: string
    catalogItemName: string
    // For bottle-tracked spirits: pour size in oz is converted to a fraction of
    // a bottle using the catalog item's bottleVolumeMl. For items sold as a
    // whole sealed unit (canned beer/RTD tracked as EACH/BOTTLE), pass qty 1
    // directly instead. For draft beer tracked as KEG, pass the keg fraction
    // per pint directly (KEG_FRACTION_PER_PINT).
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

    // Well pours - confirmed with the owner which bottle each one is.
    { recipeName: 'Well vodka', catalogItemName: 'Taaka' },
    { recipeName: 'well teq', catalogItemName: 'Torada Silver' },
    { recipeName: 'Well whiskey', catalogItemName: 'Kentucky Deluxe' },
    { recipeName: 'Captain morgan', catalogItemName: 'Captain Morgan Original' },

    // Draft beer - 16oz pint depletes a fraction of a half-barrel keg. Corona
    // Premier is sold both ways but the POS only has one line item for it, so
    // per the owner it defaults to draft here.
    { recipeName: 'Michelob Ultra', catalogItemName: 'Michelob Ultra', wholeUnitsPerSale: KEG_FRACTION_PER_PINT },
    { recipeName: 'Modelo', catalogItemName: 'Modelo', wholeUnitsPerSale: KEG_FRACTION_PER_PINT },
    { recipeName: 'Karbach Hopadillo IPA', catalogItemName: 'Karbach Hopadillo IPA', wholeUnitsPerSale: KEG_FRACTION_PER_PINT },
    { recipeName: 'Stella Artois', catalogItemName: 'Stella Artois', wholeUnitsPerSale: KEG_FRACTION_PER_PINT },
    { recipeName: 'Corona Premier', catalogItemName: 'Corona Premier', wholeUnitsPerSale: KEG_FRACTION_PER_PINT },

    // "Corona Extra" and "BTL Corona Extra" are the same POS item listed twice
    // per the owner - both map to the one bottled Corona Extra catalog item.
    { recipeName: 'Corona Extra', catalogItemName: 'Corona Extra', wholeUnitsPerSale: 1 },
    { recipeName: 'BTL Corona Extra', catalogItemName: 'Corona Extra', wholeUnitsPerSale: 1 },
]

async function ensureKentuckyDeluxe() {
    const existing = await prisma.item.findFirst({ where: { name: 'Kentucky Deluxe' } })
    if (existing) return

    // Not in the catalog yet - confirmed as the well whiskey pour but never added.
    // Cloned from Torada Silver (another well-tier bottle) for category/pour/bottle
    // size, since every other well item in this catalog uses the same 2oz/1000ml
    // pattern. Cost/par are placeholders - update them with real numbers.
    const torada = await prisma.item.findFirst({ where: { name: 'Torada Silver' } })
    if (!torada) {
        console.log('SKIP creating "Kentucky Deluxe": reference item "Torada Silver" not found')
        return
    }

    await prisma.item.create({
        data: {
            name: 'Kentucky Deluxe',
            brand: 'Kentucky Deluxe',
            type: 'BAR',
            categoryId: torada.categoryId,
            subCategoryId: torada.subCategoryId,
            unitType: 'BOTTLE',
            pourSizeOz: 2,
            bottleVolumeMl: 1000,
            onHand: 0,
            minPar: 3,
            reorderQty: 3,
            cost: 0,
        },
    })
    console.log('Created catalog item "Kentucky Deluxe" (placeholder cost/par - update with real numbers)')
}

async function main() {
    await ensureKentuckyDeluxe()

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
