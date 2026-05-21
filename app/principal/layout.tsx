import { PrincipalSidebar } from "@/components/principal-sidebar"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function PrincipalLayout({
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
    console.error("Auth session fetch failed in principal layout:", error);
  }

  if (!session) {
    redirect("/login")
  }

  // Allow all principal roles (e.g., principal_kg, principal_elementary, principal_middle, principal_high)
  if (!session.user.role?.startsWith("principal")) {
    redirect("/")
  }

  // Determine which principal school this is based on role, to display nicely
  let schoolType = ""
  if (session.user.role === "principal_kg") schoolType = "KG "
  if (session.user.role === "principal_elementary") schoolType = "Elementary "
  if (session.user.role === "principal_middle") schoolType = "Middle School "
  if (session.user.role === "principal_high") schoolType = "High School "

  return (
    <SidebarProvider>
      <PrincipalSidebar />
      <SidebarInset className="overflow-x-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4 justify-between sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="text-sm font-medium text-muted-foreground">{schoolType}Principal Portal</div>
          </div>
          <ModeToggle />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 overflow-x-hidden min-w-0">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
