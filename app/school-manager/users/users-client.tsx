"use client"

import { useState } from "react"
import { updateUserRole, toggleUserBan } from "@/app/actions/users"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, ShieldAlert, ShieldCheck, UserCog } from "lucide-react"
import { toast } from "sonner"

const AVAILABLE_ROLES = [
  { value: "guest", label: "Guest" },
  { value: "student", label: "Student" },
  { value: "accountant", label: "Accountant" },
  { value: "finance_head", label: "Finance Head" },
  { value: "school_manager", label: "School Manager" },
  { value: "principal", label: "Principal (All)" },
  { value: "principal_kg", label: "Principal (KG)" },
  { value: "principal_primary", label: "Principal (Primary)" },
  { value: "principal_middle", label: "Principal (Middle)" },
  { value: "principal_high", label: "Principal (High)" },
]

type User = {
  id: string
  name: string
  email: string
  role: string
  isBanned: boolean
  createdAt: Date
}

export function UsersClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      await updateUserRole(userId, newRole)
      toast.success("Role updated successfully")
    } catch (error) {
      toast.error("Failed to update role")
      setUsers(initialUsers) // Revert on failure
    }
  }

  async function handleToggleBan(userId: string, currentBanStatus: boolean) {
    const newBanStatus = !currentBanStatus
    try {
      setUsers(users.map(u => u.id === userId ? { ...u, isBanned: newBanStatus } : u))
      await toggleUserBan(userId, newBanStatus)
      toast.success(newBanStatus ? "User banned" : "User access restored")
    } catch (error) {
      toast.error("Failed to update ban status")
      setUsers(initialUsers) // Revert on failure
    }
  }

  return (
    <Card className="shadow-sm border-border">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <UserCog className="w-5 h-5 text-primary" />
              System Users
            </CardTitle>
            <CardDescription>
              View and manage user access and permissions.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8 bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No users found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className={user.isBanned ? "bg-red-50/50 dark:bg-red-950/20" : ""}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={user.isBanned}
                      value={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-[180px] h-8 bg-background">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_ROLES.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {user.isBanned ? (
                      <Badge variant="destructive" className="font-normal shadow-sm">Banned</Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal shadow-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={user.isBanned ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => handleToggleBan(user.id, user.isBanned)}
                      className="h-8 transition-colors"
                    >
                      {user.isBanned ? (
                        <>
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          Unban
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          Ban
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
