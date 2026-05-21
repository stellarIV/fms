import { Metadata } from "next"
import { RegisterForm } from "@/components/register-form"

import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Create an account - Finance Management System",
  description: "Create an account to get started",
}

export default async function RegisterPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (session) {
    redirect("/")
  }

  return <RegisterForm />
}
