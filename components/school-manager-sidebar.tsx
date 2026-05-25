"use client"

import * as React from "react"
import {
  ClipboardList, Wallet, Users, BarChart3, LogOut, Settings, Building2, UserCog, GraduationCap
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, SidebarFooter,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const navItems = [
  { title: "Purchase Orders", url: "/school-manager/purchase-orders", icon: ClipboardList },
  { title: "Payments", url: "/school-manager/payments", icon: Wallet },
  { title: "Payroll", url: "/school-manager/payroll", icon: Users },
  { title: "Budget Plan", url: "/school-manager/budget-plan", icon: BarChart3 },
  { title: "Student Accounts", url: "/school-manager/students", icon: GraduationCap },
  { title: "User Management", url: "/school-manager/users", icon: UserCog },
]

export function SchoolManagerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6 gap-2">
        <Building2 className="h-5 w-5 text-primary shrink-0" />
        <span className="font-bold text-lg tracking-tight text-foreground">School Manager</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/school-manager/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={handleSignOut} className="w-full">
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
