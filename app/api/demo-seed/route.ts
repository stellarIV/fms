import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, student, monthlyPayment } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { randomUUID } from "crypto";

const DEMO_ACCOUNTS = [
  { email: "accountant@fms.demo", name: "Demo Accountant", role: "accountant" },
  { email: "financehead@fms.demo", name: "Demo Finance Head", role: "finance_head" },
  { email: "principal@fms.demo", name: "Demo Principal", role: "principal" },
  { email: "schoolmanager@fms.demo", name: "Demo School Manager", role: "school_manager" },
  { email: "student@fms.demo", name: "Demo Student", role: "student" },
];

const PASSWORD = "Demo@1234";

export async function POST() {
  const log: string[] = [];
  try {
    for (const def of DEMO_ACCOUNTS) {
      const existing = await db.query.user.findFirst({
        where: eq(user.email, def.email),
      });

      let userId: string;

      if (existing) {
        userId = existing.id;
        if (existing.role !== def.role) {
          await db.update(user).set({ role: def.role }).where(eq(user.id, existing.id));
          log.push(`✓ Updated role for ${def.email} → ${def.role}`);
        } else {
          log.push(`✓ Already exists: ${def.email}`);
        }
      } else {
        // Use better-auth's own signup so password is hashed the same way auth expects
        const result = await auth.api.signUpEmail({
          body: { email: def.email, password: PASSWORD, name: def.name } as any,
        });

        if (!result?.user?.id) {
          log.push(`✗ Failed to create: ${def.email}`);
          continue;
        }

        userId = result.user.id;

        // Correct the role — signUpEmail defaults to "guest"
        await db.update(user).set({ role: def.role, emailVerified: true }).where(eq(user.id, userId));
        log.push(`✅ Created: ${def.email} (${def.role})`);
      }

      // If this is a student, create student record
      if (def.role === "student") {
        const existingStudent = await db.query.student.findFirst({
          where: eq(student.userId, userId),
        });

        if (!existingStudent) {
          const studentId = randomUUID();
          await db.insert(student).values({
            id: studentId,
            rollNo: "DEMO-001",
            name: def.name,
            paymentCode: "KG-A",
            isRegistrationPaid: false,
            isLibraryFeePaid: false,
            userId: userId,
          });
          log.push(`✅ Created student record for ${def.email}`);

          // Create a sample monthly payment record
          await db.insert(monthlyPayment).values({
            id: randomUUID(),
            studentId: studentId,
            month: 1,
            year: 2017, // Ethiopian calendar
            prevPending: 0,
            registrationFee: 500,
            libraryFee: 300,
            tuitionFee: 1500,
            transportFee: 800,
            penaltyFee: 3100, // Total due
            totalMonthlyFee: 3100,
            totalPayment: 0,
            pendingFee: 3100,
          });
          log.push(`✅ Created sample payment record for student`);
        } else {
          log.push(`✓ Student record already exists for ${def.email}`);
        }
      }
    }

    return NextResponse.json({ success: true, log });
  } catch (error: any) {
    console.error("Demo seed error:", error);
    return NextResponse.json({ success: false, error: error.message, log }, { status: 500 });
  }
}
