import { getCurrentUser } from "@/app/actions/auth-actions"
import { getCategoriesWithSub } from "@/app/actions/category-actions"
import { UsersSection } from "@/components/settings/users-section"
import { CategoryManager } from "@/components/settings/category-manager"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function SettingsPage() {
    const currentUser = await getCurrentUser()

    if (!currentUser || currentUser.role !== "ADMIN") {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Staff accounts and catalog structure.</p>
                </div>
                <Card>
                    <CardContent className="flex items-center gap-3 py-8 text-muted-foreground">
                        <ShieldAlert className="h-5 w-5" />
                        Only admin accounts can view or change settings.
                    </CardContent>
                </Card>
            </div>
        )
    }

    const categories = await getCategoriesWithSub()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">Staff accounts and catalog structure.</p>
            </div>
            <UsersSection />
            <CategoryManager categories={categories} />
        </div>
    )
}
