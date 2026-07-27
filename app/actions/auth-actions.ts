"use server"

import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { pinSchema } from "@/lib/schemas"

const THROTTLE_COOKIE = "login_throttle"
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 15 * 60 * 1000 // 15 minutes

interface ThrottleState {
    attempts: number
    lockUntil: number
}

async function readThrottleState(): Promise<ThrottleState> {
    const cookieStore = await cookies()
    const raw = cookieStore.get(THROTTLE_COOKIE)?.value
    if (!raw) return { attempts: 0, lockUntil: 0 }
    try {
        const parsed = JSON.parse(raw)
        return {
            attempts: typeof parsed.attempts === "number" ? parsed.attempts : 0,
            lockUntil: typeof parsed.lockUntil === "number" ? parsed.lockUntil : 0,
        }
    } catch {
        return { attempts: 0, lockUntil: 0 }
    }
}

async function writeThrottleState(state: ThrottleState | null) {
    const cookieStore = await cookies()
    if (!state) {
        cookieStore.delete(THROTTLE_COOKIE)
        return
    }
    cookieStore.set(THROTTLE_COOKIE, JSON.stringify(state), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1 hour, well beyond the lockout window
        path: "/",
    })
}

export async function login(pin: string) {
    const parsedPin = pinSchema.safeParse(pin)
    if (!parsedPin.success) {
        return { success: false, error: "PIN must be 4-6 digits" }
    }

    const now = Date.now()
    const throttle = await readThrottleState()

    if (throttle.lockUntil > now) {
        const minutesLeft = Math.ceil((throttle.lockUntil - now) / 60000)
        return {
            success: false,
            error: `Too many failed attempts. Try again in ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"}.`,
        }
    }

    // PINs are hashed at rest, so we can't look a user up by PIN directly -
    // compare against every account that has one set.
    const candidates = await prisma.user.findMany({
        where: { pinHash: { not: null } },
    })

    let matchedUser: (typeof candidates)[number] | null = null
    for (const candidate of candidates) {
        if (!candidate.pinHash) continue
        if (await bcrypt.compare(parsedPin.data, candidate.pinHash)) {
            matchedUser = candidate
            break
        }
    }

    if (!matchedUser) {
        const nextAttempts = throttle.lockUntil > 0 ? 1 : throttle.attempts + 1
        if (nextAttempts >= MAX_ATTEMPTS) {
            await writeThrottleState({ attempts: 0, lockUntil: now + LOCKOUT_MS })
            return {
                success: false,
                error: `Too many failed attempts. Try again in ${LOCKOUT_MS / 60000} minutes.`,
            }
        }
        await writeThrottleState({ attempts: nextAttempts, lockUntil: 0 })
        return { success: false, error: "Invalid PIN" }
    }

    await writeThrottleState(null)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("session", matchedUser.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    })

    return { success: true }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete("session")
    redirect("/login")
}

export async function getCurrentUser() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("session")?.value

    if (!userId) return null

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })
        return user
    } catch (e) {
        return null
    }
}
