import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyPayment, student } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

// Helper: calculate penalty based on bank date day-of-month


// Waterfall distribution
function waterfall(credit: number, prevPending: number, regFee: number, penalty: number, transport: number, tuition: number) {
  let remaining = credit;
  const applied = { prevPending: 0, regFee: 0, penalty: 0, transport: 0, tuition: 0 };

  const apply = (bucket: keyof typeof applied, amount: number) => {
    const paid = Math.min(remaining, amount);
    applied[bucket] = paid;
    remaining -= paid;
  };

  apply("prevPending", prevPending);
  apply("regFee", regFee);
  apply("penalty", penalty);
  apply("transport", transport);
  apply("tuition", tuition);

  return { applied, newPending: Math.max(0, remaining === 0 ? (prevPending + regFee + penalty + transport + tuition) - credit : 0) };
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = parseInt(searchParams.get("month") || "1");
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());

    const payments = await db.query.monthlyPayment.findMany({
      where: and(
        eq(monthlyPayment.month, month),
        eq(monthlyPayment.year, year)
      ),
      with: { student: true },
    });

    return NextResponse.json(payments);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, month, year, totalPayment, bankDate: bankDateRaw } = body;

    const s = await db.query.student.findFirst({ where: eq(student.id, studentId) });
    if (!s) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Get previous month's pending
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevPayment = await db.query.monthlyPayment.findFirst({
      where: and(
        eq(monthlyPayment.studentId, studentId),
        eq(monthlyPayment.month, prevMonth),
        eq(monthlyPayment.year, prevYear)
      ),
    });

    const bankDate = bankDateRaw ? new Date(bankDateRaw) : null;
    const prevPending = 0; 
    const regFee = month === 1 && !s.isRegistrationPaid ? 375 : 0;
    const transport = 800;
    const tuition = 1500;
    const totalMonthlyFee = prevPending + regFee + transport + tuition;
    
    // Penalty is the balance (Total Fee - Total Payment)
    let penaltyFee = totalMonthlyFee - (totalPayment ?? 0);
    if (penaltyFee < 0) penaltyFee = 0;

    const [newPayment] = await db
      .insert(monthlyPayment)
      .values({
        id: randomUUID(),
        studentId,
        month,
        year,
        prevPending,
        registrationFee: regFee,
        tuitionFee: tuition,
        transportFee: transport,
        penaltyFee,
        totalMonthlyFee,
        totalPayment: totalPayment ?? 0,
        pendingFee: 0,
        bankDate,
      })
      .returning();

    return NextResponse.json(newPayment, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
