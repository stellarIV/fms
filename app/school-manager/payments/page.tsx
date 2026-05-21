import { db } from "@/db";
import { monthlyPayment } from "@/db/schema";
import { desc, gt } from "drizzle-orm";
import { TransactionsClient } from "@/app/accountant/revenue/transactions/transactions-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SMPaymentsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "school_manager") redirect("/login");

  const transactions = await db.query.monthlyPayment.findMany({
    where: gt(monthlyPayment.totalPayment, 0),
    with: { student: true },
    orderBy: [desc(monthlyPayment.updatedAt)],
  });

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Payments Overview</h1>
        <p className="text-sm text-muted-foreground">Read-only view of all recorded student payments.</p>
      </div>
      <TransactionsClient initialTransactions={transactions as any} />
    </div>
  );
}
