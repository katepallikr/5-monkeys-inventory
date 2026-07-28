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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Role } from "@prisma/client"
import { createUser, updateUser } from "@/app/actions/user-actions"
import { userSchema, type UserFormValues } from "@/lib/schemas"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface UserFormProps {
    user?: { id: string; name: string; email: string; role: Role }
    onSuccess: () => void
}

export function UserForm({ user, onSuccess }: UserFormProps) {
    const [loading, setLoading] = useState(false)

    const form = useForm<UserFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(userSchema) as any,
        defaultValues: {
            name: user?.name ?? "",
            email: user?.email ?? "",
            role: user?.role ?? "STAFF",
        },
    })

    async function onSubmit(values: UserFormValues) {
        setLoading(true)
        const res = user ? await updateUser(user.id, values) : await createUser(values)
        setLoading(false)
        if (res.success) {
            toast.success(user ? "Staff account updated" : "Staff account created")
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
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Full name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MANAGER">Manager</SelectItem>
                                    <SelectItem value="STAFF">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={loading} className="w-full">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {user ? "Save Changes" : "Create Account"}
                </Button>
            </form>
        </Form>
    )
}
