import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            <Sidebar className="hidden md:block w-64 flex-shrink-0" />
            <div className="flex-1 flex flex-col min-h-screen">
                <Topbar />
                <main className="flex-1 space-y-4 p-8 pt-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
