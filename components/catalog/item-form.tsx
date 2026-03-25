"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Category, SubCategory, Vendor, ItemType, UnitType } from "@prisma/client"
import { createItem } from "@/app/actions/item-actions"
import { useState } from "react"
import { Loader2 } from "lucide-react"

const itemSchema = z.object({
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
    bottleVolumeMl: z.coerce.number().optional()
})

type ItemFormValues = z.infer<typeof itemSchema>

interface ItemFormProps {
    categories: (Category & { subCategories: SubCategory[] })[]
    vendors: Vendor[]
    onSuccess: () => void
}

export function ItemForm({ categories, vendors, onSuccess }: ItemFormProps) {
    const [loading, setLoading] = useState(false)
    const [selectedType, setSelectedType] = useState<ItemType | null>(null)

    const form = useForm<ItemFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(itemSchema) as any,
        defaultValues: {
            name: "",
            onHand: 0,
            minPar: 0,
            unitType: "EACH"
        },
    })

    const filteredCategories = selectedType
        ? categories.filter(c => c.type === selectedType)
        : categories

    const selectedCategoryId = form.watch("categoryId")
    const selectedCategory = categories.find(c => c.id === selectedCategoryId)

    async function onSubmit(values: ItemFormValues) {
        setLoading(true)
        const res = await createItem(values)
        setLoading(false)
        if (res.success) {
            form.reset()
            onSuccess()
        } else {
            alert("Error creating item")
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Item Name..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={(val) => {
                                    field.onChange(val)
                                    setSelectedType(val as ItemType)
                                    form.setValue("categoryId", "")
                                }} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="KITCHEN">Kitchen</SelectItem>
                                        <SelectItem value="BAR">Bar</SelectItem>
                                        <SelectItem value="HOOKAH">Hookah</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="unitType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Unit</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.keys(UnitType).map((u) => (
                                            <SelectItem key={u} value={u}>{u}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="categoryId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedType}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {filteredCategories.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {selectedCategory && selectedCategory.subCategories.length > 0 && (
                        <FormField
                            control={form.control}
                            name="subCategoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sub-Category</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sub" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {selectedCategory.subCategories.map((s) => (
                                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="onHand"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Stock</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="minPar"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Par Level</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="preferredVendorId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Vendor</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Vendor (Optional)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {vendors.map((v) => (
                                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Conditional Fields for Bar */}
                {selectedType === "BAR" && (
                    <div className="p-4 border rounded-md bg-secondary/50 space-y-4">
                        <h4 className="font-medium">Bar Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="bottleVolumeMl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bottle Vol (ml)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="750" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="pourSizeOz"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Pour Size (oz)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="1.5" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}

                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Item
                </Button>
            </form>
        </Form>
    )
}
