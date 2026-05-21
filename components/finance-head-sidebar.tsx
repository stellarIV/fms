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
  PieChart
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
import { usePathname } from "next/navigation"

const data = {
  navMain: [
    {
      title: "Revenue",
      icon: ArrowDownRight,
      items: [
        { title: "Dashboard", url: "/finance-head/revenue/dashboard", icon: LayoutDashboard },
        { title: "Payments", url: "/finance-head/revenue/payments", icon: Wallet },
        { title: "Invoices", url: "/finance-head/revenue/invoices", icon: Receipt },
        { title: "Transactions", url: "/finance-head/revenue/transactions", icon: Banknote },
        { title: "Audit Log", url: "/finance-head/revenue/audit-log", icon: ShieldAlert },
        { title: "Reports", url: "/finance-head/revenue/reports", icon: PieChart },
      ],
    },
    {
      title: "Expenses",
      icon: ArrowUpRight,
      items: [
        { title: "Dashboard", url: "/finance-head/expenses/dashboard", icon: LayoutDashboard },
        { title: "Purchase Orders", url: "/finance-head/expenses/orders", icon: FileText },
        { title: "Payroll", url: "/finance-head/expenses/payroll", icon: Users },
      ],
    },
  ],
}

export function FinanceHeadSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader className="h-16 flex items-center justify-center border-b px-6">
         <span className="font-bold text-lg tracking-tight text-foreground">FMS Finance Head</span>
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
              <Link href="/finance-head/settings">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button onClick={() => alert("Sign out coming soon!")}>
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
