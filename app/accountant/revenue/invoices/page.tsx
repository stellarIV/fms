import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { InvoicesClient } from "./invoices-client";

export default async function InvoicesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "accountant") {
    redirect("/login");
  }

  return (
    <div className="flex flex-col gap-4 w-full p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Student Invoices</h1>
        <p className="text-sm text-muted-foreground">
          Manage and track billing invoices for all students.
        </p>
      </div>

      <InvoicesClient />
    </div>
  );
}
