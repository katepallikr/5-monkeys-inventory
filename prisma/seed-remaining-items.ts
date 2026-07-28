/**
 * Second pass: creates catalog items that didn't exist at all (confirmed with
 * the owner they should be added as placeholders - cost/par are $0/defaults,
 * update with real numbers), plus the hookah flavor/coal catalog and recipes.
 *
 * Hookah flavor->brand assignments and the coal count/size are BEST-EFFORT
 * assumptions (the follow-up question that would have confirmed them got
 * interrupted) - verify and correct in the catalog UI if wrong. The depletion
 * math itself doesn't depend on brand, only on the gram/coal counts below.
 *
 * Usage: npx tsx prisma/seed-remaining-items.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const MIXERS_CATEGORY_ID = '881b1c35-427d-4d61-b4d0-7ed2f54309a3'
const BEER_CATEGORY_ID = '16dadcf8-8e3d-406b-be56-ffd145db4859'
const HOOKAH_FLAVORS_CATEGORY_ID = '6305569b-a8b7-4718-b0b9-4f581c1200e5'
const HOOKAH_COALS_CATEGORY_ID = '0b1803bf-0fc8-4db2-8677-fcd8940300cf'

// recipeName MUST exactly match the "Item"/"Menu Item" column in the sales CSV.
interface NewBeverage {
    recipeName: string
    itemName: string
    categoryId: string
}

const newBeverages: NewBeverage[] = [
    { recipeName: 'Btl Lonestar', itemName: 'Lone Star', categoryId: BEER_CATEGORY_ID },
    // Rotates seasonally per the owner - rename/re-cost each time the seasonal changes.
    { recipeName: 'Btl sam', itemName: 'Samuel Adams Seasonal', categoryId: BEER_CATEGORY_ID },
    { recipeName: 'Highnoon', itemName: 'High Noon', categoryId: BEER_CATEGORY_ID },
    { recipeName: 'Red Bull', itemName: 'Red Bull', categoryId: MIXERS_CATEGORY_ID },
    { recipeName: 'Coke', itemName: 'Coke', categoryId: MIXERS_CATEGORY_ID },
    { recipeName: 'Diet coke', itemName: 'Diet Coke', categoryId: MIXERS_CATEGORY_ID },
    { recipeName: 'Dr pepper', itemName: 'Dr Pepper', categoryId: MIXERS_CATEGORY_ID },
    { recipeName: 'Ginger Ale', itemName: 'Ginger Ale', categoryId: MIXERS_CATEGORY_ID },
]

// BEST-EFFORT brand guess per flavor - not confirmed, verify in the catalog UI.
interface HookahFlavor {
    recipeName: string // matches sales CSV exactly
    itemName: string
    brand: 'Al Fakher' | 'Starbuzz'
}

const hookahFlavors: HookahFlavor[] = [
    { recipeName: 'Blueberry with mint', itemName: 'Blueberry with Mint', brand: 'Al Fakher' },
    { recipeName: 'Double Apple', itemName: 'Double Apple', brand: 'Al Fakher' },
    { recipeName: 'Dream Scape', itemName: 'Dream Scape', brand: 'Starbuzz' },
    { recipeName: 'Paan Raas', itemName: 'Paan Raas', brand: 'Starbuzz' },
    { recipeName: 'Exotic Watermelon', itemName: 'Exotic Watermelon', brand: 'Starbuzz' },
]

const GRAMS_PER_BOWL = 25 // confirmed with owner
const COALS_PER_BOWL = 3 // NOT confirmed - default assumption, verify
const COAL_ITEM_NAME = 'Coconut Coals'

async function ensureItem(name: string, categoryId: string, unitType: 'EACH' | 'BOTTLE' | 'GRAM', type: 'BAR' | 'HOOKAH') {
    const existing = await prisma.item.findFirst({ where: { name } })
    if (existing) return existing
    const item = await prisma.item.create({
        data: { name, type, categoryId, unitType, onHand: 0, minPar: 0, cost: 0 },
    })
    console.log(`Created catalog item "${name}" (placeholder cost/par - update with real numbers)`)
    return item
}

async function ensureRecipe(recipeName: string, category: string) {
    let recipe = await prisma.recipe.findFirst({ where: { name: recipeName } })
    if (!recipe) {
        recipe = await prisma.recipe.create({ data: { name: recipeName, category } })
    }
    return recipe
}

async function setIngredient(recipeId: string, itemId: string, quantity: number, unit: string) {
    const existing = await prisma.recipeIngredient.findFirst({ where: { recipeId, itemId } })
    if (existing) {
        await prisma.recipeIngredient.update({ where: { id: existing.id }, data: { quantity, unit } })
    } else {
        await prisma.recipeIngredient.create({ data: { recipeId, itemId, quantity, unit } })
    }
}

async function main() {
    for (const b of newBeverages) {
        const item = await ensureItem(b.itemName, b.categoryId, 'EACH', 'BAR')
        const recipe = await ensureRecipe(b.recipeName, 'Bar')
        await setIngredient(recipe.id, item.id, 1, 'EACH')
        console.log(`OK "${b.recipeName}" -> "${b.itemName}" (1.0000 EACH/sale)`)
    }

    const coal = await ensureItem(COAL_ITEM_NAME, HOOKAH_COALS_CATEGORY_ID, 'EACH', 'HOOKAH')

    for (const f of hookahFlavors) {
        const flavorItem = await ensureItem(f.itemName, HOOKAH_FLAVORS_CATEGORY_ID, 'GRAM', 'HOOKAH')
        if (!flavorItem.brand) {
            await prisma.item.update({ where: { id: flavorItem.id }, data: { brand: f.brand } })
        }
        const recipe = await ensureRecipe(f.recipeName, 'Hookah')
        await setIngredient(recipe.id, flavorItem.id, GRAMS_PER_BOWL, 'GRAM')
        await setIngredient(recipe.id, coal.id, COALS_PER_BOWL, 'EACH')
        console.log(`OK "${f.recipeName}" -> "${f.itemName}" (${GRAMS_PER_BOWL}g) + ${COAL_ITEM_NAME} (${COALS_PER_BOWL} each)`)
    }

    await prisma.$disconnect()
}

main().catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})
