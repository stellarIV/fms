import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { monthlyPayment, student } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";



export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const current = await db.query.monthlyPayment.findFirst({
      where: eq(monthlyPayment.id, id),
      with: { student: true },
    });

    if (!current) return NextResponse.json({ error: "Payment not found" }, { status: 404 });

    // Validate: can't set receipt number if total payment is 0
    if ("receiptNumber" in body && body.receiptNumber && (body.totalPayment ?? current.totalPayment) === 0) {
      return NextResponse.json({ error: "Cannot add a Receipt Number when Total Payment is 0" }, { status: 400 });
    }

    const totalPayment = body.totalPayment ?? current.totalPayment;
    const prevPending = 0; 
    const regFee = current.month === 1 && !current.student.isRegistrationPaid ? 375 : current.registrationFee;
    const totalMonthlyFee = prevPending + regFee + current.transportFee + current.tuitionFee;
    
    let penaltyFee = body.penaltyFee ?? (totalMonthlyFee - totalPayment);
    if (penaltyFee < 0) penaltyFee = 0;

    const [updated] = await db
      .update(monthlyPayment)
      .set({
        ...body,
        penaltyFee,
        totalMonthlyFee,
        pendingFee: 0,
        registrationFee: regFee,
        updatedAt: new Date(),
      })
      .where(eq(monthlyPayment.id, id))
      .returning();

    // Mark registration as paid if covered
    if (regFee > 0 && totalPayment >= regFee) {
      await db.update(student)
        .set({ isRegistrationPaid: true, updatedAt: new Date() })
        .where(eq(student.id, current.studentId));
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
