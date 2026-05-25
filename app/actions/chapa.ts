"use server";

import { db } from "@/db";
import { monthlyPayment, student } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

export async function initializeChapaPayment(paymentId: string, _clientAmount?: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    const payment = await db.query.monthlyPayment.findFirst({
      where: eq(monthlyPayment.id, paymentId),
      with: { student: true },
    });

    if (!payment) return { success: false, error: "Payment record not found." };
    if (payment.student.userId !== session.user.id) {
      return { success: false, error: "Unauthorized." };
    }

    // Amount always from backend — never trust client
    const amount = (payment.penaltyFee || 0) > 0 ? payment.penaltyFee : (payment.totalMonthlyFee || 0);

    // tx_ref must be ≤ 50 chars — encode paymentId as hex slice + base36 timestamp
    const shortId = paymentId.replace(/-/g, "").slice(0, 20);
    const txRef = `FMS${shortId}T${Date.now().toString(36)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const chapaKey = process.env.CHAPA_SECRET_KEY;
    console.log("CHAPA_SECRET_KEY present:", !!chapaKey, chapaKey?.slice(0, 10));
    console.log("Student email:", session.user.email);

    // MOCK MODE — no Chapa key configured yet
    if (!chapaKey) {
      const mockUrl = `${appUrl}/student/payment/success?tx_ref=${txRef}&mock=1&pid=${paymentId}`;
      return { success: true, checkoutUrl: mockUrl, txRef };
    }

    const chapaRes = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chapaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount.toString(),
        currency: "ETB",
        email: "abebech_bekele@gmail.com",
        first_name: session.user.name?.split(" ")[0] || "Student",
        last_name: session.user.name?.split(" ").slice(1).join(" ") || "User",
        tx_ref: txRef,
        callback_url: `${appUrl}/api/chapa/verify`,
        return_url: `${appUrl}/student/payment/success?tx_ref=${txRef}&pid=${paymentId}`,
        customization: {
          title: "School Fee",
          description: `Month ${payment.month}-${payment.year}`,
        },
        meta: {
          invoices: [
            { key: "Tuition Fee", value: `${payment.tuitionFee} ETB` },
            ...(payment.transportFee > 0 ? [{ key: "Transport Fee", value: `${payment.transportFee} ETB` }] : []),
            ...(payment.registrationFee > 0 ? [{ key: "Registration Fee", value: `${payment.registrationFee} ETB` }] : []),
            ...(payment.libraryFee > 0 ? [{ key: "Library Fee", value: `${payment.libraryFee} ETB` }] : []),
            { key: "Total", value: `${amount} ETB` },
          ],
        },
      }),
    });

    const data = await chapaRes.json();
    console.log("Chapa response:", JSON.stringify(data));

    if (data.status !== "success" || !data.data?.checkout_url) {
      return { success: false, error: typeof data.message === "string" ? data.message : "Chapa initialization failed." };
    }

    // Store txRef → paymentId mapping in receiptNumber so we can look it up on return
    await db.update(monthlyPayment)
      .set({ receiptNumber: `PENDING:${txRef}:${paymentId}` })
      .where(eq(monthlyPayment.id, paymentId));

    return { success: true, checkoutUrl: data.data.checkout_url, txRef };
  } catch (error: any) {
    console.error("initializeChapaPayment error:", error);
    return { success: false, error: error.message };
  }
}

export async function mockRecordPayment(txRef: string, _unused?: number, _pid?: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "student") {
      return { success: false, error: "Unauthorized" };
    }

    // pid param carries the full paymentId for mock payments
    const paymentId = _pid || "";
    if (!paymentId) return { success: false, error: "Missing payment ID." };

    const payment = await db.query.monthlyPayment.findFirst({
      where: eq(monthlyPayment.id, paymentId),
      with: { student: true },
    });
    if (!payment) return { success: false, error: "Payment record not found." };
    if (payment.student.userId !== session.user.id) return { success: false, error: "Unauthorized." };

    // Amount is always what's still owed — calculated from backend, not user input
    const amount = (payment.penaltyFee || 0) > 0 ? payment.penaltyFee : payment.totalMonthlyFee;
    const newTotal = (payment.totalPayment || 0) + amount;
    const balance = Math.max(0, (payment.totalMonthlyFee || 0) - newTotal);

    await db.update(monthlyPayment).set({
      totalPayment: newTotal,
      penaltyFee: balance,
      receiptNumber: txRef,
      updatedAt: new Date(),
    }).where(eq(monthlyPayment.id, paymentId));

    return { success: true, amount };
  } catch (error: any) {
    console.error("mockRecordPayment error:", error);
    return { success: false, error: error.message };
  }
}

export async function verifyChapaPayment(txRef: string, pid?: string) {
  try {
    const chapaKey = process.env.CHAPA_SECRET_KEY;
    const chapaRes = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${txRef}`, {
      headers: { Authorization: `Bearer ${chapaKey}` },
    });

    const data = await chapaRes.json();
    console.log("Chapa verify response:", JSON.stringify(data));
    if (data.status !== "success") {
      return { success: false, error: "Payment verification failed." };
    }

    const amount = parseFloat(data.data.amount);

    // Look up by pid param first, fallback to PENDING:txRef mapping in receiptNumber
    let payment = pid
      ? await db.query.monthlyPayment.findFirst({ where: eq(monthlyPayment.id, pid) })
      : null;

    if (!payment) {
      payment = await db.query.monthlyPayment.findFirst({
        where: eq(monthlyPayment.receiptNumber, `PENDING:${txRef}:${pid || ""}`),
      });
    }
    if (!payment) {
      // Last resort: search all PENDING receipts for this txRef
      const all = await db.query.monthlyPayment.findMany();
      payment = all.find(p => p.receiptNumber?.startsWith(`PENDING:${txRef}:`)) ?? null;
    }
    if (!payment) return { success: false, error: "Payment record not found." };

    const newTotal = (payment.totalPayment || 0) + amount;
    const balance = Math.max(0, payment.totalMonthlyFee - newTotal);

    await db.update(monthlyPayment).set({
      totalPayment: newTotal,
      penaltyFee: balance,
      receiptNumber: txRef,
      updatedAt: new Date(),
    }).where(eq(monthlyPayment.id, payment.id));

    return { success: true, amount };
  } catch (error: any) {
    console.error("verifyChapaPayment error:", error);
    return { success: false, error: error.message };
  }
}

export async function getStudentPayments() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "student") return { success: false, data: null };

    const studentRecord = await db.query.student.findFirst({
      where: eq(student.userId, session.user.id),
    });
    if (!studentRecord) return { success: false, data: null, error: "Student record not found." };

    const payments = await db.query.monthlyPayment.findMany({
      where: eq(monthlyPayment.studentId, studentRecord.id),
      orderBy: (p, { desc }) => [desc(p.year), desc(p.month)],
    });

    return { success: true, data: { student: studentRecord, payments } };
  } catch (error: any) {
    return { success: false, data: null, error: error.message };
  }
}
