# 5 Monkeys Inventory

This is the main inventory management app for 5 Monkeys. It handles tracking everything for the kitchen, bar, and hookah setup. Built with Next.js and Prisma for the db.

## getting started

1. Check that your `.env` is set up with the right db connection string (`DATABASE_URL="file:./dev.db"` for local sqlite). If you don't have it, ping someone on the team.
2. Run `npm install` to grab the latest packages.
3. Run `npx prisma generate` if this is your first time setting up the project.
4. Start up the dev server:

```bash
npm run dev
```

It should be running at `http://localhost:3000`. To access the dashboard locally, use the seeded dev PIN (`1234`, admin account only). We will map this to full user accounts later.

## validation

Server actions in `app/actions/` validate input with `zod` schemas defined in `lib/schemas.ts`, rather than trusting raw form data. Anything that touches the database from a form or file upload - the item catalog form, recipe/count/PO actions, and the CSV/XLSX importers - goes through one of these schemas and returns a `{ success: false, error: "..." }` result with a specific message on invalid input instead of throwing.

## authentication

Login is PIN-based (see `app/actions/auth-actions.ts`):
- PINs are hashed with `bcryptjs` and never stored or compared in plaintext (`User.pinHash` in the schema).
- After 5 failed login attempts, further attempts are locked out for 15 minutes (tracked via a short-lived cookie, not tied to a specific account since the PIN alone doesn't reveal which user was being guessed at).
- This is still a shared quick-login PIN, not per-user email/password accounts - see `TODO.md`.

To reset the seeded admin PIN, either re-run `npx prisma db seed` against a fresh db, or hash a new PIN with `bcryptjs` and update `User.pinHash` directly.

## data imports

Two CSV/XLSX importers deplete or add to inventory - both validate structure up front and reject the whole file with a specific error before writing anything to the database if the file doesn't match the expected shape (no more silent partial imports or crashes on a malformed row).

**Sales report** (`/sales`, `app/actions/sales-actions.ts`) - accepts either a Toast "pmix" export (`Menu Item` / `Item Qty` columns) or a Square "Item Sales" export (`Item` / `Qty sold` columns), CSV or XLSX. Column mapping for each format lives in `ITEM_NAME_COLUMNS`/`QTY_SOLD_COLUMNS` in `sales-actions.ts` - add another pair there to support a different POS export. Summary/subtotal rows without an item name are skipped automatically; rows with an unparseable quantity are reported back as skipped rows in the import result. Each filename can only be imported once (checked against `SalesBatch.filename`).

**Purchase order / vendor invoice** (`/purchasing`, `app/actions/purchasing-actions.ts`) - expects a Sysco order-export CSV: an `H,...` header line with the order date and total, followed by `P,...` product lines with SKU and quantity. A header or product line missing required columns returns a clear error instead of crashing. Line items whose SKU/description don't match anything in the catalog are skipped and counted in the result (`unmatchedSkus`) rather than silently dropped. Duplicate detection is by vendor + source filename, so re-uploading the same export is rejected.

If you want other report formats supported (e.g. a different POS export, or a non-Sysco vendor invoice layout), the schemas in `lib/schemas.ts` and the parsing in the corresponding action are the place to extend - happy to wire up automated imports for a specific vendor/POS format if you share a sample export.

## drink recipes

For a sales import to actually deplete inventory (not just create an empty placeholder `Recipe`), the menu item needs a `Recipe` whose name exactly matches the sales report's item name, with `RecipeIngredient` rows pointing at real catalog items. `prisma/seed-drink-recipes.ts` and `prisma/seed-remaining-items.ts` set this up for the bar/drink menu (re-run either with `npx tsx prisma/<file>.ts` - both are idempotent). Two depletion patterns are used depending on how the catalog item is tracked:

- **Whole units** (bottled beer, canned RTDs, sodas) - 1 sale depletes 1 unit of the item's own `unitType`.
- **Fractional units** (spirits poured as a shot, draft beer poured from a keg) - depletes `pourSize / containerSize` per sale, computed from the item's `pourSizeOz`/`bottleVolumeMl` (or a keg-size constant for draft). This matters because `onHand` for these items is tracked in whole bottles/kegs, not ounces - depleting by a flat oz number instead of the fraction would drain a bottle roughly 15-30x too fast. Hookah flavor tobacco sidesteps the container-size question entirely by tracking `onHand` directly in `GRAM`s instead of canisters.

Still not covered by these scripts (need more input from the business owner, not a guess): specialty cocktails with real ingredient ratios, and the pre-existing `Jack Daniels Shot` recipe/duplicate catalog entries.

## notes
- This uses the Next.js app router so try to keep server actions separated in the `app/actions/` folder instead of mixing them into components.
- There's a known quirk where Prisma sometimes gets out of sync locally. If your build fails complaining about missing types or exports, just run `npx prisma generate` to fix it up.
- We recently cleaned up the unused boilerplate SVGs and old folders, so try to keep things tidy before pushing.
