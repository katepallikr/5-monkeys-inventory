"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { Vendor } from "@prisma/client"
import { createVendor, updateVendor } from "@/app/actions/vendor-actions"
import { vendorSchema, type VendorFormValues } from "@/lib/schemas"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface VendorFormProps {
    vendor?: Vendor
    onSuccess: () => void
}

export function VendorForm({ vendor, onSuccess }: VendorFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<VendorFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(vendorSchema) as any,
        defaultValues: {
            name: vendor?.name ?? "",
            contact: vendor?.contact ?? "",
            email: vendor?.email ?? "",
            phone: vendor?.phone ?? "",
        },
    })

    async function onSubmit(values: VendorFormValues) {
        setLoading(true)
        const res = vendor ? await updateVendor(vendor.id, values) : await createVendor(values)
        setLoading(false)
        if (res.success) {
            toast.success(vendor ? "Vendor updated" : "Vendor created")
            form.reset()
            onSuccess()
        } else {
            toast.error(res.error || "Something went wrong")
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
                            <FormLabel>Vendor Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Sysco" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contact Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Optional" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="Optional" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                    <Input placeholder="Optional" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {vendor ? "Save Changes" : "Create Vendor"}
                </Button>
            </form>
        </Form>
    )
}
