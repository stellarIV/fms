import { Suspense } from "react";
import { db } from "@/db";
import { monthlyPayment } from "@/db/schema";
import { PaymentsClient } from "./payments-client";
import { CsvImportDialog } from "./csv-import-dialog";
import { getMonthlyPaymentStatus } from "@/app/actions/payments";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_FEES, getLibraryFeeByGrade } from "@/lib/constants";
import { getGradeFromPaymentCode } from "@/lib/utils";

export default async function PaymentsPage(props: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "accountant") {
    redirect("/login");
  }

  const month = parseInt(searchParams.month || "1");
  const year = parseInt(searchParams.year || "2017"); // Default to current EC year or similar

  let payments = await db.query.monthlyPayment.findMany({
    where: and(
      eq(monthlyPayment.month, month),
      eq(monthlyPayment.year, year)
    ),
    with: {
      student: true,
    },
  });

  if (payments.length === 0) {
    // Generate payments for this month based on all students
    const students = await db.query.student.findMany();
    if (students.length > 0) {
      const crypto = require("crypto");
      const newPayments = students.map((student) => {
        const registrationFee = month === 1 && !student.isRegistrationPaid ? DEFAULT_FEES.registration : 0;
        const tuitionFee = DEFAULT_FEES.tuition;
        const usesTransport = parseInt(student.paymentCode.replace(/\D/g, "") || "1", 10) % 3 !== 0;
        const transportFee = usesTransport ? DEFAULT_FEES.transport : 0;
        const grade = getGradeFromPaymentCode(student.paymentCode);
        const libraryFee = student.isLibraryFeePaid ? 0 : getLibraryFeeByGrade(grade);
        return {
          id: crypto.randomUUID(),
          studentId: student.id,
          month: month,
          year: year,
          registrationFee,
          libraryFee,
          tuitionFee,
          transportFee,
          totalMonthlyFee: registrationFee + libraryFee + tuitionFee + transportFee,
          totalPayment: 0,
          penaltyFee: 0,
        };
      });

      await db.insert(monthlyPayment).values(newPayments);

      // Re-fetch the newly inserted payments
      payments = await db.query.monthlyPayment.findMany({
        where: and(
          eq(monthlyPayment.month, month),
          eq(monthlyPayment.year, year)
        ),
        with: {
          student: true,
        },
      });
    }
  }

  // Ensure consistent sorting across months by Roll No (alphanumeric)
  payments.sort((a, b) => {
    return a.student.rollNo.localeCompare(b.student.rollNo, undefined, { numeric: true, sensitivity: 'base' });
  });

  const statusRes = await getMonthlyPaymentStatus(month, year);
  const monthlyStatus = statusRes.success && statusRes.data ? statusRes.data : null;

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-2 shrink-0 w-full">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Payments Management</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            Manage student accounts, fees, and penalties for Month {month}, {year}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0 justify-end">
          <CsvImportDialog month={month} year={year} />
        </div>
      </div>

      <div className="w-full min-w-0 overflow-hidden flex-1">
        <Suspense fallback={<div>Loading payments...</div>}>
          <PaymentsClient 
            initialPayments={payments as any} 
            monthlyStatus={monthlyStatus}
          />
        </Suspense>
      </div>
    </div>
  );
}
