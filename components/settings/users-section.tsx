import { getUsers } from "@/app/actions/user-actions"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserDialog } from "./user-dialog"
import { ResetPinDialog } from "./reset-pin-dialog"

export async function UsersSection() {
    const users = await getUsers()

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle>Staff & PINs</CardTitle>
                    <CardDescription>Manage who can log in and their role.</CardDescription>
                </div>
                <UserDialog />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>PIN</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No staff accounts yet.
                                </TableCell>
                            </TableRow>
                        )}
                        {users.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="font-medium">{u.name}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                                </TableCell>
                                <TableCell>
                                    {u.hasPin ? (
                                        <span className="text-sm text-muted-foreground">Set</span>
                                    ) : (
                                        <span className="text-sm text-amber-600">Not set</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                    <ResetPinDialog userId={u.id} userName={u.name} />
                                    <UserDialog user={u} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
