"use server";

import { db } from "@/db";
import { monthlyPayment, student, monthlyPaymentStatus } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getLibraryFeeByGrade } from "@/lib/constants";
import { getGradeFromPaymentCode } from "@/lib/utils";

export async function updatePayment(id: string, updates: Partial<typeof monthlyPayment.$inferInsert>) {
  return updatePaymentsBatch([{ id, data: updates }]);
}

export async function updatePaymentsBatch(batch: { id: string, data: any }[]) {
  try {
    // 1. Check for duplicates WITHIN the batch itself
    const receiptsInBatch = batch
      .map(item => item.data.receiptNumber)
      .filter(r => r && r.trim() !== "");
    
    const uniqueReceiptsInBatch = new Set(receiptsInBatch);
    if (uniqueReceiptsInBatch.size !== receiptsInBatch.length) {
      return { success: false, error: "Duplicate receipt numbers found within your changes. Each transaction must have a unique receipt number." };
    }

    // 2. Check for duplicates in the DATABASE
    if (receiptsInBatch.length > 0) {
      const existing = await db.query.monthlyPayment.findMany({
        where: (monthlyPayment, { inArray, and, not }) => and(
          inArray(monthlyPayment.receiptNumber, receiptsInBatch),
          // We must exclude the current records being updated from the "exists" check
          not(inArray(monthlyPayment.id, batch.map(b => b.id)))
        )
      });

      if (existing.length > 0) {
        const firstDup = existing[0].receiptNumber;
        return { success: false, error: `Receipt number "${firstDup}" is already used by another student. Please verify the receipt number.` };
      }
    }

    // Process all updates in parallel on the server
    const updatePromises = batch.map(async (item) => {
      const { id, data: updates } = item;
      
      const currentPayment = await db.query.monthlyPayment.findFirst({
        where: eq(monthlyPayment.id, id),
        with: { student: true }
      });

      if (!currentPayment) return;

      let remainingPayment = updates.totalPayment ?? currentPayment.totalPayment;

      // Registration fee — once per student (month 1 only)
      let registrationFee = currentPayment.registrationFee;
      if (currentPayment.month === 1 && !currentPayment.student.isRegistrationPaid) {
        registrationFee = 375;
      }

      // Library fee — once per student ever (any month)
      let libraryFee = currentPayment.libraryFee ?? 0;
      if (!currentPayment.student.isLibraryFeePaid && libraryFee === 0) {
        const grade = getGradeFromPaymentCode(currentPayment.student.paymentCode);
        libraryFee = getLibraryFeeByGrade(grade);
      }

      const totalMonthlyFee =
        (currentPayment.tuitionFee || 0) +
        (currentPayment.transportFee || 0) +
        registrationFee +
        libraryFee;

      let penaltyFee = updates.penaltyFee ?? Math.max(0, totalMonthlyFee - remainingPayment);

      await db.update(monthlyPayment).set({
        ...updates,
        penaltyFee,
        totalMonthlyFee,
        registrationFee,
        libraryFee,
        updatedAt: new Date(),
      }).where(eq(monthlyPayment.id, id));

      // Flip one-time fee flags when payment is received
      if (remainingPayment > 0) {
        const flagUpdates: Record<string, boolean> = {};
        if (registrationFee > 0 && !currentPayment.student.isRegistrationPaid) {
          flagUpdates.isRegistrationPaid = true;
        }
        if (libraryFee > 0 && !currentPayment.student.isLibraryFeePaid) {
          flagUpdates.isLibraryFeePaid = true;
        }
        if (Object.keys(flagUpdates).length > 0) {
          await db.update(student)
            .set(flagUpdates)
            .where(eq(student.id, currentPayment.studentId));
        }
      }
    });

    await Promise.all(updatePromises);

    revalidatePath("/accountant/revenue/payments");
    return { success: true };
  } catch (error: any) {
    console.error("Batch update error:", error);
    return { success: false, error: error.message };
  }
}

export async function getMonthlyPaymentStatus(month: number, year: number) {
  try {
    const status = await db.query.monthlyPaymentStatus.findFirst({
      where: and(
        eq(monthlyPaymentStatus.month, month),
        eq(monthlyPaymentStatus.year, year)
      )
    });
    return { success: true, data: status };
  } catch (error: any) {
    console.error("Get monthly payment status error:", error);
    return { success: false, error: error.message };
  }
}

export async function updateMonthlyPaymentStatus(month: number, year: number, status: string, rejectionReason?: string) {
  try {
    const existing = await db.query.monthlyPaymentStatus.findFirst({
      where: and(
        eq(monthlyPaymentStatus.month, month),
        eq(monthlyPaymentStatus.year, year)
      )
    });

    if (existing) {
      await db.update(monthlyPaymentStatus)
        .set({ status, rejectionReason, updatedAt: new Date() })
        .where(eq(monthlyPaymentStatus.id, existing.id));
    } else {
      const crypto = await import("crypto");
      await db.insert(monthlyPaymentStatus).values({
        id: crypto.randomUUID(),
        month,
        year,
        status,
        rejectionReason,
      });
    }

    revalidatePath("/finance-head/revenue/payments");
    revalidatePath("/accountant/revenue/payments");
    revalidatePath("/principal/students-info");
    return { success: true };
  } catch (error: any) {
    console.error("Update monthly payment status error:", error);
    return { success: false, error: error.message };
  }
}
