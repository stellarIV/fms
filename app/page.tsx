import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function RootPage() {
  let session = null;
  try {
    session = await auth.api.getSession({
      headers: await headers()
    })
  } catch (error) {
    console.error("Auth session fetch failed in root page:", error);
  }

  if (!session) {
    redirect("/login")
  }

  const role = session.user.role || "guest"

  if (role === "accountant") redirect("/accountant");
  if (role === "school_manager" || role === "school manager") redirect("/school-manager");
  if (role.startsWith("principal")) redirect("/principal");
  if (role === "finance head" || role === "finance_head") redirect("/finance-head/dashboard");
  if (role === "student") redirect("/student/dashboard");

  redirect("/pending-approval");
}
