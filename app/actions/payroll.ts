"use server"

import { db } from "@/db"
import { payroll } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { nanoid } from "nanoid"

export async function savePayrollAction(data: any[]) {
  try {
    if (!data || data.length === 0) return { success: true };

    // Prepare values for insertion
    const values = data.map(row => ({
      id: row.id || nanoid(),
      no: row.no,
      name: row.name,
      position: row.position,
      section: row.section,
      basicSalary: row.basicSalary,
      forPensionContributionDeductionPurpose: row.forPensionContributionDeductionPurpose,
      accWorkingDate: row.accWorkingDate,
      allowanceForServiceAssistance: row.allowanceForServiceAssistance,
      allowanceForOvertime: row.allowanceForOvertime,
      taxableIncome: row.taxableIncome,
      grossSalary: row.grossSalary,
      receivable: row.receivable,
      updatedAt: new Date()
    }));

    // Perform high-performance batch upsert
    await db.insert(payroll)
      .values(values)
      .onConflictDoUpdate({
        target: payroll.no,
        set: {
          name: sql`excluded.name`,
          position: sql`excluded.position`,
          section: sql`excluded.section`,
          basicSalary: sql`excluded."basicSalary"`,
          forPensionContributionDeductionPurpose: sql`excluded."forPensionContributionDeductionPurpose"`,
          accWorkingDate: sql`excluded."accWorkingDate"`,
          allowanceForServiceAssistance: sql`excluded."allowanceForServiceAssistance"`,
          allowanceForOvertime: sql`excluded."allowanceForOvertime"`,
          taxableIncome: sql`excluded."taxableIncome"`,
          grossSalary: sql`excluded."grossSalary"`,
          receivable: sql`excluded.receivable`,
          updatedAt: sql`excluded."updatedAt"`
        }
      });

    return { success: true };
  } catch (error) {
    console.error("Save payroll error:", error);
    return { success: false, error: String(error) };
  }
}


export async function getPayrollAction() {
  try {
    const data = await db.query.payroll.findMany({
      orderBy: (payroll, { asc }) => [asc(payroll.no)]
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

export async function deletePayrollEmployeeAction(no: number) {
  try {
    await db.delete(payroll).where(eq(payroll.no, no));
    return { success: true };
  } catch (error) {
    console.error("Delete payroll employee error:", error);
    return { success: false, error: String(error) };
  }
}

export async function replacePayrollDataAction(data: any[]) {
  try {
    // Delete all existing records
    await db.delete(payroll);
    
    if (!data || data.length === 0) return { success: true };

    // Prepare values for insertion
    const values = data.map(row => ({
      id: row.id || nanoid(),
      no: row.no,
      name: row.name,
      position: row.position,
      section: row.section,
      basicSalary: row.basicSalary,
      forPensionContributionDeductionPurpose: row.forPensionContributionDeductionPurpose,
      accWorkingDate: row.accWorkingDate,
      allowanceForServiceAssistance: row.allowanceForServiceAssistance,
      allowanceForOvertime: row.allowanceForOvertime,
      taxableIncome: row.taxableIncome,
      grossSalary: row.grossSalary,
      receivable: row.receivable,
      updatedAt: new Date()
    }));

    // Insert all new records
    await db.insert(payroll).values(values);

    return { success: true };
  } catch (error) {
    console.error("Replace payroll data error:", error);
    return { success: false, error: String(error) };
  }
}
