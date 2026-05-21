import { Suspense } from "react";
import { db } from "@/db";
import { monthlyPayment, student as studentTable } from "@/db/schema";
import { PaymentsClient } from "@/app/accountant/revenue/payments/payments-client";
import { getMonthlyPaymentStatus } from "@/app/actions/payments";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_FEES } from "@/lib/constants";
import { getGradeFromPaymentCode } from "@/lib/utils";

export default async function StudentsInfoPage(props: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user.role?.startsWith("principal")) {
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

  if (payments.length === 0) {
    const students = await db.query.student.findMany();
    if (students.length > 0) {
      const crypto = await import("crypto");
      const newPayments = students.map((student) => {
        const registrationFee = month === 1 ? DEFAULT_FEES.registration : 0;
        const tuitionFee = DEFAULT_FEES.tuition;
        const usesTransport = parseInt(student.paymentCode.replace(/\D/g, "") || "1", 10) % 3 !== 0;
        const transportFee = usesTransport ? DEFAULT_FEES.transport : 0;
        return {
          id: crypto.randomUUID(),
          studentId: student.id,
          month: month,
          year: year,
          registrationFee,
          tuitionFee,
          transportFee,
          totalMonthlyFee: registrationFee + tuitionFee + transportFee,
          totalPayment: 0,
          penaltyFee: 0,
        };
      });

      await db.insert(monthlyPayment).values(newPayments);
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

  // Filter based on principal role
  const role = session.user.role;
  const filteredPayments = payments.filter(p => {
    const grade = getGradeFromPaymentCode(p.student.paymentCode);
    if (role === "principal_kg") return grade.startsWith("KG");
    if (role === "principal_elementary") return ["Grade 1", "Grade 2", "Grade 3", "Grade 4"].includes(grade);
    if (role === "principal_middle") return ["Grade 5", "Grade 6", "Grade 7", "Grade 8"].includes(grade);
    if (role === "principal_high") return ["Grade 9", "Grade 10", "Grade 11", "Grade 12"].includes(grade);
    return true;
  });

  filteredPayments.sort((a, b) => {
    return a.student.rollNo.localeCompare(b.student.rollNo, undefined, { numeric: true, sensitivity: 'base' });
  });

  const statusRes = await getMonthlyPaymentStatus(month, year);
  const monthlyStatus = statusRes.success && statusRes.data ? statusRes.data : null;

  return (
    <div className="flex flex-col gap-2 w-full min-w-0">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-2 shrink-0 w-full">
        <div className="space-y-0.5 min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight truncate">Students Information</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
            Manage student payments and account info for your section. Month {month}, {year}.
          </p>
        </div>
      </div>

      <div className="w-full min-w-0 overflow-hidden flex-1">
        <Suspense fallback={<div>Loading student info...</div>}>
          <PaymentsClient 
            initialPayments={filteredPayments as any} 
            principalMode={true} 
            monthlyStatus={monthlyStatus}
          />
        </Suspense>
      </div>
    </div>
  );
}

