"use client"

import { useState } from "react"
import { login } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Lock, Loader2 } from "lucide-react"

export default function LoginPage() {
    const [pin, setPin] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        if (!pin) return

        setLoading(true)
        const res = await login(pin)

        if (res.success) {
            toast.success("Welcome back!")
            router.push("/")
            router.refresh()
        } else {
            toast.error(res.error || "Login Failed")
            setLoading(false)
            setPin("")
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm mx-4">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-4 rounded-full">
                            <Lock className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">Access Required</CardTitle>
                    <CardDescription>Enter your 4-digit PIN code to continue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            type="password"
                            placeholder="PIN Code"
                            className="text-center text-lg tracking-widest"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            autoFocus
                        />
                        <Button type="submit" className="w-full" disabled={loading || pin.length < 4}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Unlock Dashboard"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
