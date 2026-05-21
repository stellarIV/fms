import { Metadata } from "next"
import { LoginForm } from "@/components/login-form"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Sign In - Finance Management System",
  description: "Sign in to your account",
}

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (session) {
    redirect("/")
  }

  return <LoginForm />
}
