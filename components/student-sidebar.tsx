"use client"

import * as React from "react"
import { LayoutDashboard, CreditCard, History, LogOut, GraduationCap } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, SidebarFooter,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"

const navItems = [
  { title: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
  { title: "Pay Fees", url: "/student/pay", icon: CreditCard },
  { title: "Payment History", url: "/student/payments", icon: History },
]

export function StudentSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6 gap-2">
        <GraduationCap className="h-5 w-5 text-primary shrink-0" />
        <span className="font-bold text-lg tracking-tight text-foreground">Student Portal</span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
            My Account
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
