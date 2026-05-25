"use client"

import * as React from "react"
import {
  Banknote,
  LayoutDashboard,
  Wallet,
  FileText,
  ShieldAlert,
  ArrowDownRight,
  ArrowUpRight,
  Settings,
  LogOut,
  Users,
  Receipt,
  PieChart,
  Zap,
  BookOpen
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

const data = {
  navMain: [
    {
      title: "Revenue",
      icon: ArrowDownRight,
      items: [
        { title: "Dashboard", url: "/accountant/revenue/dashboard", icon: LayoutDashboard },
        { title: "Payments", url: "/accountant/revenue/payments", icon: Wallet },
        { title: "Invoices", url: "/accountant/revenue/invoices", icon: Receipt },
        { title: "Transactions", url: "/accountant/revenue/transactions", icon: Banknote },
        { title: "Audit Log", url: "/accountant/revenue/audit-log", icon: ShieldAlert },
        { title: "Reports", url: "/accountant/revenue/reports", icon: PieChart },
        { title: "General Ledger", url: "/accountant/ledger", icon: BookOpen },
      ],
    },
    {
      title: "Expenses",
      icon: ArrowUpRight,
      items: [
        { title: "Dashboard", url: "/accountant/expenses/dashboard", icon: LayoutDashboard },
        { title: "Purchase Orders", url: "/accountant/expenses/orders", icon: FileText },
        { title: "Payroll", url: "/accountant/expenses/payroll", icon: Users },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/login")
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6">
         <span className="font-bold text-lg tracking-tight text-foreground">FMS Accountant</span>
      </SidebarHeader>
      <SidebarContent>
        {data.navMain.map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">{group.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname.startsWith(item.url);
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
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/accountant/settings">
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
