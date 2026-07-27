import { z } from "zod"
import { ItemType, UnitType } from "@prisma/client"

export function formatZodError(error: z.ZodError): string {
    return error.issues.map((i) => i.message).join("; ")
}

export const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export function validateImportFile(file: File | null, allowedExtensions: string[]): string | null {
    if (!file || file.size === 0) return "No file uploaded"
    if (file.size > MAX_IMPORT_FILE_SIZE) {
        return `File too large (max ${MAX_IMPORT_FILE_SIZE / (1024 * 1024)}MB)`
    }
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!ext || !allowedExtensions.includes(ext)) {
        return `Unsupported file type "${ext ? "." + ext : "unknown"}". Expected: ${allowedExtensions.join(", ")}`
    }
    return null
}

// Item catalog form - shared between client form and server action
export const itemSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    type: z.nativeEnum(ItemType),
    categoryId: z.string().min(1, "Category is required"),
    subCategoryId: z.string().optional(),
    unitType: z.nativeEnum(UnitType),
    minPar: z.coerce.number().min(0, "Must be positive"),
    onHand: z.coerce.number().min(0),
    preferredVendorId: z.string().optional(),
    storageLocation: z.string().optional(),
    pourSizeOz: z.coerce.number().optional(),
    bottleVolumeMl: z.coerce.number().optional(),
})
export type ItemFormValues = z.infer<typeof itemSchema>

// Sales (pmix) CSV/XLSX row - only the columns the importer actually uses
export const pmixRowSchema = z.object({
    "Menu Item": z.string().trim().min(1, "Menu Item is required"),
    "Item Qty": z.coerce.number({ error: "Item Qty must be a number" }),
})

// Sysco order export header line ("H,...")
export const syscoHeaderSchema = z.object({
    dateStr: z.string().trim().min(1, "Order date is missing from the file header"),
    total: z.coerce.number({ error: "Order total is missing or invalid in the file header" }),
})

// Sysco order export product line ("P,...")
export const syscoLineItemSchema = z.object({
    sku: z.string().trim().min(1, "SKU is required"),
    qty: z.coerce.number({ error: "Quantity must be a number" }),
})

export const createPoSchema = z.object({
    vendorId: z.string().min(1, "Vendor is required"),
})

export const addPOItemSchema = z.object({
    poId: z.string().min(1, "Purchase order is required"),
    itemId: z.string().min(1, "Item is required"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    unitCost: z.coerce.number().min(0, "Unit cost cannot be negative"),
})

export const createRecipeSchema = z.object({
    name: z.string().trim().min(1, "Recipe name is required"),
})

export const addIngredientSchema = z.object({
    recipeId: z.string().min(1, "Recipe is required"),
    itemId: z.string().min(1, "Item is required"),
    quantity: z.coerce.number().positive("Quantity must be greater than 0"),
    unit: z.string().trim().min(1, "Unit is required"),
})

export const createCountSessionSchema = z.object({
    name: z.string().trim().min(1, "Session name is required"),
    type: z.union([z.nativeEnum(ItemType), z.literal("FULL")]),
    userId: z.string().min(1, "User is required"),
})

export const saveCountSchema = z.object({
    sessionId: z.string().min(1, "Session is required"),
    itemId: z.string().min(1, "Item is required"),
    quantity: z.coerce.number().min(0, "Count cannot be negative"),
})

export const pinSchema = z
    .string()
    .trim()
    .regex(/^\d{4,6}$/, "PIN must be 4-6 digits")
