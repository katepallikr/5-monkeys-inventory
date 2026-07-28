/**
 * Sets up Recipe -> RecipeIngredient mappings for the "House Cocktails" menu
 * (screenshotted from the Toast ordering page - the site itself is blocked by
 * this session's network policy, so no fetch was possible).
 *
 * The menu only lists ingredients, not pour sizes, so quantities use a
 * confirmed-with-owner default convention rather than real recipe cards:
 *   - 1st spirit listed  = BASE     = 1.5oz
 *   - every spirit after  = MODIFIER = 0.5oz
 *   - juice/syrup/mixer   = MIX      = 0.75oz
 *   - "splash of X"       = SPLASH   = 1oz (own extrapolation from the
 *     confirmed convention, not itself confirmed - flag if wrong)
 *   - "topped with a full can of X" = FULL_CAN = the whole can (qty 1)
 * Garnishes (peel, cherry, mint, olive, celery, Tajín rim) and bitters
 * (dash-based) are intentionally NOT tracked - not something a bar
 * realistically inventories per-cocktail, and no quantity was given anyway.
 *
 * "Flights $13.49" (a 3-drink margarita sampler) is skipped - which 3
 * margaritas and in what proportion isn't specified anywhere.
 *
 * The 4 straight spirit shots on this same menu (Jack Daniels Tennessee
 * Apple/Fire, Jose Cuervo Devils Reserve, Skrewball Peanut butter) are NOT
 * here - they follow the existing single-spirit-shot pattern and were added
 * to the `mappings` array in seed-drink-recipes.ts instead.
 *
 * Usage: npx tsx prisma/seed-house-cocktails.ts (idempotent, safe to re-run)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const OZ_PER_ML = 1 / 29.5735

const LIQUOR_CATEGORY_ID = 'c1487bd9-9de5-4e2c-9b04-fb5c9eb38311'
const LIQUEURS_CATEGORY_ID = '7b43065e-e23b-41b7-8a9a-1c76902b3391'
const WINE_CATEGORY_ID = 'af9408a4-ae49-4566-9017-33e3eddfe4f5'
const BITTERS_SYRUPS_CATEGORY_ID = 'e31e4d12-afd5-49cf-a0e1-a4221e069649'
const MIXERS_CATEGORY_ID = '881b1c35-427d-4d61-b4d0-7ed2f54309a3'

const BOURBON_SUBCAT_ID = 'e12b4b3e-9ca1-40d7-8d5c-7ad36146515f'
const RYE_WHISKEY_SUBCAT_ID = '60965a15-64d8-4a1e-955d-7e210cbced5f'
const TEQUILA_SUBCAT_ID = 'ca48b3de-bda5-4abf-868f-f72812e235ca'

interface NewItem {
    name: string
    categoryId: string
    subCategoryId?: string
    bottleVolumeMl: number
    unitType?: 'BOTTLE' | 'EACH'
}

// Brand-new catalog items this menu needs that didn't exist before. Bottle
// sizes are reasonable defaults (750ml spirits/syrups, 1L juices/vermouth),
// not confirmed - update if the real product size differs.
const newItems: NewItem[] = [
    // Spirits
    { name: 'Old Forester', categoryId: LIQUOR_CATEGORY_ID, subCategoryId: BOURBON_SUBCAT_ID, bottleVolumeMl: 750 },
    { name: 'Sazerac Rye', categoryId: LIQUOR_CATEGORY_ID, subCategoryId: RYE_WHISKEY_SUBCAT_ID, bottleVolumeMl: 750 },
    { name: 'Milagro Silver', categoryId: LIQUOR_CATEGORY_ID, subCategoryId: TEQUILA_SUBCAT_ID, bottleVolumeMl: 750 },
    { name: 'Carpano Antica Sweet Vermouth', categoryId: WINE_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Carpano Dry Vermouth', categoryId: WINE_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Grand Marnier', categoryId: LIQUEURS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Aperol', categoryId: LIQUEURS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Melon Liqueur', categoryId: LIQUEURS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Blue Curaçao', categoryId: LIQUEURS_CATEGORY_ID, bottleVolumeMl: 750 },

    // Syrups/purees
    { name: 'Simple Syrup', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Agave Syrup', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Bordeaux Cherry Syrup', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Grenadine', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Passion Fruit Syrup', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Vanilla Syrup', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Spicy Mango Syrup', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Strawberry Puree', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Jalapeño Syrup', categoryId: BITTERS_SYRUPS_CATEGORY_ID, bottleVolumeMl: 750 },

    // Juices/mixers
    { name: 'Lemon Juice', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Lime Juice', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Grapefruit Juice', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Pineapple Juice', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Simply Orange', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Simply Cranberry', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Sweet & Sour', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Zing Zang', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Grape Juice', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Fever Tree Sparkling Grapefruit', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Fever Tree Ginger Beer', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Soda Water', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Caffè Borghetti Espresso', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Sprite', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 1000 },
    { name: 'Watermelon Red Bull', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 250, unitType: 'EACH' },
    { name: 'Red Bull Sugarfree', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 250, unitType: 'EACH' },

    // Already in the catalog but missing a container size - listed here only
    // so ensureItem's patch path fills it in (category/unitType below are
    // ignored for existing items, just needed to satisfy the type).
    { name: 'Prosecco', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 750 },
    { name: 'Coke', categoryId: MIXERS_CATEGORY_ID, bottleVolumeMl: 355, unitType: 'EACH' },
]

type Role = 'BASE' | 'MOD' | 'MIX' | 'SPLASH' | 'FULL_CAN'

const OZ_BY_ROLE: Record<Exclude<Role, 'FULL_CAN'>, number> = {
    BASE: 1.5,
    MOD: 0.5,
    MIX: 0.75,
    SPLASH: 1,
}

interface CocktailIngredient {
    catalogItemName: string // exact Item.name, curly apostrophes matched to the existing catalog
    role: Role
}

interface Cocktail {
    recipeName: string // must match the sales report's Item/Menu Item column
    ingredients: CocktailIngredient[]
}

const cocktails: Cocktail[] = [
    { recipeName: 'Lost in the Forest', ingredients: [{ catalogItemName: 'Old Forester', role: 'BASE' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }] },
    { recipeName: 'Jungle Rye', ingredients: [{ catalogItemName: 'Bulleit Rye Whiskey', role: 'BASE' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }] },
    { recipeName: 'Monkeytail Manhattan', ingredients: [{ catalogItemName: 'Russell', role: 'BASE' }, { catalogItemName: 'Carpano Antica Sweet Vermouth', role: 'MOD' }] },
    { recipeName: 'Cherry Ransom', ingredients: [{ catalogItemName: 'Sazerac Rye', role: 'BASE' }, { catalogItemName: 'Sweet & Sour', role: 'MIX' }, { catalogItemName: 'Bordeaux Cherry Syrup', role: 'MIX' }] },
    { recipeName: 'Citrus Swing', ingredients: [{ catalogItemName: 'Woodford Reserve Bourbon', role: 'BASE' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }, { catalogItemName: 'Lemon Juice', role: 'MIX' }] },
    { recipeName: 'Wanderlust Whiskey', ingredients: [{ catalogItemName: 'Traveller Blend N9 40', role: 'BASE' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }, { catalogItemName: 'Lemon Juice', role: 'MIX' }] },
    { recipeName: 'Grapefruit Swing', ingredients: [{ catalogItemName: 'Milagro Silver', role: 'BASE' }, { catalogItemName: 'Grapefruit Juice', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }, { catalogItemName: 'Fever Tree Sparkling Grapefruit', role: 'MIX' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }] },
    { recipeName: 'Monkey’s Mask', ingredients: [{ catalogItemName: 'El Tequileño Reposado', role: 'BASE' }, { catalogItemName: 'Dos Hombres Mezcal', role: 'MOD' }, { catalogItemName: 'Agave Syrup', role: 'MIX' }] },
    { recipeName: 'Sun Swinger', ingredients: [{ catalogItemName: 'Corazón Tequila Blanco', role: 'BASE' }, { catalogItemName: 'Simply Orange', role: 'MIX' }, { catalogItemName: 'Grenadine', role: 'MIX' }, { catalogItemName: 'Passion Fruit Syrup', role: 'MIX' }, { catalogItemName: 'Vanilla Syrup', role: 'MIX' }] },
    { recipeName: 'Primate Punch', ingredients: [{ catalogItemName: 'El Tequileño Reposado', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Agave Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Jungle Margarita', ingredients: [{ catalogItemName: 'Lunazul', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Agave Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Swinging Silver', ingredients: [{ catalogItemName: 'Patrón Silver', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Agave Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Spicy Swing', ingredients: [{ catalogItemName: 'Casamigos Blanco', role: 'BASE' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }, { catalogItemName: 'Pineapple Juice', role: 'MIX' }, { catalogItemName: 'Jalapeño Syrup', role: 'MIX' }] },
    { recipeName: 'Tropical Swing', ingredients: [{ catalogItemName: 'Don Julio Silver', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Lime Juice', role: 'MIX' }, { catalogItemName: 'Spicy Mango Syrup', role: 'MIX' }] },
    { recipeName: 'Monkey Melon', ingredients: [{ catalogItemName: 'Herradura', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Watermelon Red Bull', role: 'MIX' }, { catalogItemName: 'Agave Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Spicy Strawberry Swing', ingredients: [{ catalogItemName: 'Lalo', role: 'BASE' }, { catalogItemName: 'Strawberry Puree', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }, { catalogItemName: 'Jalapeño Syrup', role: 'MIX' }] },
    { recipeName: 'Golden Ape', ingredients: [{ catalogItemName: 'Maestro Dobel Diamante', role: 'BASE' }, { catalogItemName: 'Grand Marnier', role: 'MOD' }, { catalogItemName: 'Agave Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Tree Top Twist', ingredients: [{ catalogItemName: 'Grey Goose', role: 'BASE' }, { catalogItemName: 'Carpano Dry Vermouth', role: 'MOD' }] },
    { recipeName: 'Primate Espresso Twist', ingredients: [{ catalogItemName: 'Wheatley Vodka', role: 'BASE' }, { catalogItemName: 'Caffè Borghetti Espresso', role: 'MIX' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }] },
    { recipeName: 'Cheeky Chimp Twist', ingredients: [{ catalogItemName: 'Wheatley Vodka', role: 'BASE' }, { catalogItemName: 'Passion Fruit Syrup', role: 'MIX' }, { catalogItemName: 'Vanilla Syrup', role: 'MIX' }, { catalogItemName: 'Prosecco', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Citrus Monkey Twist', ingredients: [{ catalogItemName: 'Ketel One', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Simply Cranberry', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Jumping Demon Twist', ingredients: [{ catalogItemName: 'Deep Eddy Lemon', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Lemon Juice', role: 'MIX' }] },
    { recipeName: 'Paradise Punch', ingredients: [{ catalogItemName: 'Parrot Bay', role: 'BASE' }, { catalogItemName: 'Disaronno', role: 'MOD' }, { catalogItemName: 'Passion Fruit Syrup', role: 'MIX' }, { catalogItemName: 'Vanilla Syrup', role: 'MIX' }, { catalogItemName: 'Watermelon Red Bull', role: 'MIX' }] },
    { recipeName: 'Swinging Sky', ingredients: [{ catalogItemName: 'Wild Turkey 101', role: 'BASE' }, { catalogItemName: 'Aperol', role: 'MOD' }, { catalogItemName: 'Carpano Antica Sweet Vermouth', role: 'MOD' }, { catalogItemName: 'Lemon Juice', role: 'MIX' }] },
    { recipeName: 'Citrus Berry Swing', ingredients: [{ catalogItemName: 'Hendrick’s', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Strawberry Puree', role: 'MIX' }, { catalogItemName: 'Pineapple Juice', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Tree Top Toss', ingredients: [{ catalogItemName: 'Taaka', role: 'BASE' }, { catalogItemName: 'Castillo Light', role: 'MOD' }, { catalogItemName: 'Melon Liqueur', role: 'MOD' }, { catalogItemName: 'Blue Curaçao', role: 'MOD' }, { catalogItemName: 'Red Bull', role: 'FULL_CAN' }] },
    { recipeName: 'Cheeky Chimp Splash', ingredients: [{ catalogItemName: 'Captain Morgan Original', role: 'BASE' }, { catalogItemName: 'Parrot Bay', role: 'MOD' }, { catalogItemName: 'Melon Liqueur', role: 'MOD' }, { catalogItemName: 'Blue Curaçao', role: 'MOD' }, { catalogItemName: 'Pineapple Juice', role: 'MIX' }, { catalogItemName: 'Sweet & Sour', role: 'MIX' }] },
    { recipeName: 'Tito’s Twist', ingredients: [{ catalogItemName: 'Tito’s Handmade Vodka', role: 'BASE' }, { catalogItemName: 'Fever Tree Ginger Beer', role: 'MIX' }, { catalogItemName: 'Grape Juice', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Jumping Diplomatico', ingredients: [{ catalogItemName: 'Diplomático Reserva', role: 'BASE' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }] },
    { recipeName: 'Monkey Mai Tai', ingredients: [{ catalogItemName: 'Kraken Black Spiced Rum', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Pineapple Juice', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Long Island', ingredients: [{ catalogItemName: 'Tito’s Handmade Vodka', role: 'BASE' }, { catalogItemName: 'Bacardi Light', role: 'MOD' }, { catalogItemName: 'Tanqueray', role: 'MOD' }, { catalogItemName: 'Milagro Silver', role: 'MOD' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Sweet & Sour', role: 'MIX' }, { catalogItemName: 'Coke', role: 'SPLASH' }] },
    { recipeName: 'House Mojito', ingredients: [{ catalogItemName: 'Bacardi Light', role: 'BASE' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }, { catalogItemName: 'Sprite', role: 'MIX' }] },
    { recipeName: 'Monkey Fizz', ingredients: [{ catalogItemName: 'Aperol', role: 'BASE' }, { catalogItemName: 'Prosecco', role: 'MIX' }, { catalogItemName: 'Soda Water', role: 'MIX' }] },
    { recipeName: 'Rogue Bull', ingredients: [{ catalogItemName: 'Tito’s Handmade Vodka', role: 'BASE' }, { catalogItemName: 'Red Bull', role: 'FULL_CAN' }] },
    { recipeName: 'Bloody Mary', ingredients: [{ catalogItemName: 'Tito’s Handmade Vodka', role: 'BASE' }, { catalogItemName: 'Zing Zang', role: 'MIX' }] },
    { recipeName: 'Monkey Mule', ingredients: [{ catalogItemName: 'Ketel One', role: 'BASE' }, { catalogItemName: 'Fever Tree Ginger Beer', role: 'MIX' }, { catalogItemName: 'Simple Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Cherry Bull', ingredients: [{ catalogItemName: 'Ketel One', role: 'BASE' }, { catalogItemName: 'Red Bull Sugarfree', role: 'MIX' }, { catalogItemName: 'Sweet & Sour', role: 'MIX' }, { catalogItemName: 'Grenadine', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Tree Top Tripple', ingredients: [{ catalogItemName: 'Jack Daniel’s Tennessee', role: 'BASE' }, { catalogItemName: 'Naranja', role: 'MOD' }, { catalogItemName: 'Sweet & Sour', role: 'MIX' }, { catalogItemName: 'Sprite', role: 'SPLASH' }] },
    { recipeName: 'Jungle Jive Mule', ingredients: [{ catalogItemName: 'Dos Hombres Mezcal', role: 'BASE' }, { catalogItemName: 'Fever Tree Ginger Beer', role: 'MIX' }, { catalogItemName: 'Passion Fruit Syrup', role: 'MIX' }, { catalogItemName: 'Vanilla Syrup', role: 'MIX' }, { catalogItemName: 'Lime Juice', role: 'MIX' }] },
    { recipeName: 'Primate Strawberry Punch', ingredients: [{ catalogItemName: 'Wheatley Vodka', role: 'BASE' }, { catalogItemName: 'Strawberry Puree', role: 'MIX' }, { catalogItemName: 'Sweet & Sour', role: 'MIX' }, { catalogItemName: 'Sprite', role: 'MIX' }] },
]

async function ensureItem(n: NewItem) {
    const existing = await prisma.item.findFirst({ where: { name: n.name } })
    if (existing) {
        // Already in the catalog (e.g. shared with kitchen prep) but missing the
        // bottle size this script needs for oz-fraction math - patch just that,
        // leave its type/category/everything else alone.
        if (!existing.bottleVolumeMl && (existing.unitType === 'BOTTLE' || existing.unitType === 'EACH')) {
            await prisma.item.update({ where: { id: existing.id }, data: { bottleVolumeMl: n.bottleVolumeMl } })
            console.log(`Patched "${n.name}": added bottleVolumeMl=${n.bottleVolumeMl} (was missing on the existing catalog item)`)
            return { ...existing, bottleVolumeMl: n.bottleVolumeMl }
        }
        return existing
    }
    const item = await prisma.item.create({
        data: {
            name: n.name,
            type: 'BAR',
            categoryId: n.categoryId,
            subCategoryId: n.subCategoryId,
            unitType: n.unitType ?? 'BOTTLE',
            bottleVolumeMl: n.bottleVolumeMl,
            pourSizeOz: n.unitType === 'EACH' ? undefined : 1.5,
            onHand: 0,
            minPar: 0,
            cost: 0,
        },
    })
    console.log(`Created catalog item "${n.name}" (placeholder cost/par - update with real numbers)`)
    return item
}

async function fixKentuckyDeluxeSubCategory() {
    // seed-drink-recipes.ts cloned this from Torada Silver (tequila) for its
    // bottle/pour size pattern, which also copied Torada's tequila
    // subCategoryId onto a whiskey item. Correcting it while touching this data.
    const kd = await prisma.item.findFirst({ where: { name: 'Kentucky Deluxe' } })
    if (kd && kd.subCategoryId === TEQUILA_SUBCAT_ID) {
        await prisma.item.update({ where: { id: kd.id }, data: { subCategoryId: RYE_WHISKEY_SUBCAT_ID } })
        console.log('Fixed "Kentucky Deluxe" subCategoryId (was tequila, should be whiskey)')
    }
}

async function main() {
    await fixKentuckyDeluxeSubCategory()

    for (const n of newItems) {
        await ensureItem(n)
    }

    for (const c of cocktails) {
        let recipe = await prisma.recipe.findFirst({ where: { name: c.recipeName } })
        if (!recipe) {
            recipe = await prisma.recipe.create({ data: { name: c.recipeName, category: 'Bar' } })
        }

        const parts: string[] = []
        for (const ing of c.ingredients) {
            const item = await prisma.item.findFirst({ where: { name: ing.catalogItemName } })
            if (!item) {
                console.log(`  SKIP ingredient "${ing.catalogItemName}" for "${c.recipeName}": not found in catalog`)
                continue
            }

            if (ing.role !== 'FULL_CAN' && !item.bottleVolumeMl) {
                console.log(`  SKIP ingredient "${ing.catalogItemName}" for "${c.recipeName}": missing bottleVolumeMl`)
                continue
            }

            // FULL_CAN depletes the whole tracked unit; every other role is an
            // oz pour, converted to a fraction of the item's own container size
            // (bottleVolumeMl doubles as "can size" for EACH-tracked mixers
            // like Watermelon Red Bull, used here for a partial can per pour).
            const quantity = ing.role === 'FULL_CAN' ? 1 : OZ_BY_ROLE[ing.role] / (item.bottleVolumeMl! * OZ_PER_ML)

            const existingIngredient = await prisma.recipeIngredient.findFirst({
                where: { recipeId: recipe.id, itemId: item.id },
            })
            if (existingIngredient) {
                await prisma.recipeIngredient.update({ where: { id: existingIngredient.id }, data: { quantity, unit: item.unitType } })
            } else {
                await prisma.recipeIngredient.create({ data: { recipeId: recipe.id, itemId: item.id, quantity, unit: item.unitType } })
            }
            parts.push(`${ing.catalogItemName} (${quantity.toFixed(4)} ${item.unitType})`)
        }
        console.log(`OK "${c.recipeName}" -> ${parts.join(', ')}`)
    }

    await prisma.$disconnect()
}

main().catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
})
