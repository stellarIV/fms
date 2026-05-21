import { db } from "@/db";
import { monthlyPayment } from "@/db/schema";
import { desc, gt } from "drizzle-orm";
import { TransactionsClient } from "./transactions-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function TransactionsPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "accountant") {
    redirect("/login");
  }

  const transactions = await db.query.monthlyPayment.findMany({
    where: gt(monthlyPayment.totalPayment, 0),
    with: {
      student: true,
    },
    orderBy: [desc(monthlyPayment.updatedAt)],
  });

  return (
    <div className="flex flex-col gap-4 w-full p-4 md:p-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Revenue Transactions</h1>
        <p className="text-sm text-muted-foreground">
          A read-only log of all recorded student payments and transactions.
        </p>
      </div>

      <TransactionsClient initialTransactions={transactions as any} />
    </div>
  );
}
