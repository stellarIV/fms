"use server";

import { db } from "@/db";
import { payroll } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

export async function getPayrollEmployees() {
  const employees = await db.query.payroll.findMany({
    orderBy: (p, { asc }) => [asc(p.no)],
  });
  return employees;
}

export async function sendEmployeeSalary(employeeId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "finance_head") {
      return { success: false, error: "Unauthorized" };
    }

    const employee = await db.query.payroll.findFirst({
      where: eq(payroll.id, employeeId),
    });
    if (!employee) return { success: false, error: "Employee not found." };
    if (!employee.email) return { success: false, error: "Employee has no email on record." };
    if (!employee.receivable || employee.receivable <= 0) {
      return { success: false, error: "No receivable amount for this employee." };
    }

    const chapaKey = process.env.CHAPA_SECRET_KEY;
    if (!chapaKey) return { success: false, error: "Chapa not configured." };

    const txRef = `PAY${employee.no}T${Date.now().toString(36)}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const nameParts = employee.name.trim().split(" ");
    const firstName = nameParts[0] || "Employee";
    const lastName = nameParts.slice(1).join(" ") || "Staff";

    const chapaRes = await fetch(`${CHAPA_BASE_URL}/transfers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${chapaKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        account_name: employee.name,
        account_number: employee.bankAccount || "0900123456",
        amount: employee.receivable.toFixed(2),
        currency: "ETB",
        beneficiary_name: employee.name,
        email: employee.email,
        first_name: firstName,
        last_name: lastName,
        bank_code: "32",  // CBE code on Chapa
        reference: txRef,
      }),
    });

    const data = await chapaRes.json();
    console.log("Chapa transfer response:", JSON.stringify(data));

    if (data.status !== "success") {
      return { success: false, error: typeof data.message === "string" ? data.message : JSON.stringify(data.message) };
    }

    revalidatePath("/accountant/payroll");
    return { success: true, txRef, amount: employee.receivable };
  } catch (error: any) {
    console.error("sendEmployeeSalary error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendAllSalaries() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "finance_head") {
      return { success: false, error: "Unauthorized" };
    }

    const employees = await db.query.payroll.findMany();
    const results: { name: string; success: boolean; error?: string; amount?: number }[] = [];

    for (const employee of employees) {
      if (!employee.email || !employee.receivable || employee.receivable <= 0) {
        results.push({ name: employee.name, success: false, error: "Missing email or zero salary" });
        continue;
      }

      const res = await sendEmployeeSalary(employee.id);
      results.push({ name: employee.name, success: res.success, error: res.error, amount: res.amount });
    }

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return { success: true, results, succeeded, failed };
  } catch (error: any) {
    return { success: false, error: error.message, results: [], succeeded: 0, failed: 0 };
  }
}
