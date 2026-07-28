import { Sidebar } from "./Sidebar"
import { Topbar } from "./Topbar"

export default function MainLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col overflow-hidden md:flex-row">
            <Sidebar className="hidden md:flex w-64 flex-shrink-0" />
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar />
                <main className="flex-1 overflow-y-auto space-y-4 p-8 pt-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
