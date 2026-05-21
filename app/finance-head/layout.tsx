import { FinanceHeadSidebar } from "@/components/finance-head-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function FinanceHeadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers()
    })
  } catch (error) {
    console.error("Auth session fetch failed:", error);
  }

  if (!session) {
    redirect("/login")
  }

  if (session.user.role !== "finance_head") {
    redirect("/")
  }

  return (
    <SidebarProvider>
      <FinanceHeadSidebar />
      <SidebarInset className="overflow-x-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="text-sm font-medium text-muted-foreground">Finance Head Portal</div>
          </div>
          <ModeToggle />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-8 overflow-x-hidden min-w-0 bg-muted/20">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
