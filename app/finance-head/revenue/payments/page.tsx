import { Suspense } from "react";
import { db } from "@/db";
import { monthlyPayment } from "@/db/schema";
import { PaymentsClient } from "@/app/accountant/revenue/payments/payments-client";
import { getMonthlyPaymentStatus } from "@/app/actions/payments";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function FinanceHeadPaymentsPage(props: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "finance_head") {
    redirect("/login");
  }

  const month = parseInt(searchParams.month || "1");
  const year = parseInt(searchParams.year || "2017");

  let payments = await db.query.monthlyPayment.findMany({
    where: and(
      eq(monthlyPayment.month, month),
      eq(monthlyPayment.year, year)
    ),
    with: {
      student: true,
    },
  });

  const statusRes = await getMonthlyPaymentStatus(month, year);
  const monthlyStatus = statusRes.success && statusRes.data ? statusRes.data : null;

  payments.sort((a, b) => {
    return a.student.rollNo.localeCompare(b.student.rollNo, undefined, { numeric: true, sensitivity: 'base' });
  });

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-2 shrink-0 w-full">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Payments Overview</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            View student accounts, fees, and penalties for Month {month}, {year}.
          </p>
        </div>
      </div>

      <div className="w-full min-w-0 overflow-hidden flex-1">
        <Suspense fallback={<div>Loading payments...</div>}>
          <PaymentsClient 
            initialPayments={payments as any} 
            readOnlyMode={true} 
            financeHeadMode={true} 
            monthlyStatus={monthlyStatus} 
          />
        </Suspense>
      </div>
    </div>
  );
}
