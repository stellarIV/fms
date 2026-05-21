"use server"

import { db } from "@/db"
import { auditLog, payroll } from "@/db/schema"
import { desc, eq, inArray } from "drizzle-orm"
import { nanoid } from "nanoid"

export interface AuditLogEntry {
  changeDescription: string
  changerName: string
  changerRole: string
  employeeNo: number
  fieldChanged: string
  oldValue: string
  newValue: string
}

export async function createAuditLogsAction(entries: AuditLogEntry[]) {
  try {
    if (!entries || entries.length === 0) return { success: true };

    const values = entries.map(entry => ({
      id: nanoid(),
      changeDescription: entry.changeDescription,
      changerName: entry.changerName,
      changerRole: entry.changerRole,
      employeeNo: entry.employeeNo,
      fieldChanged: entry.fieldChanged,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
    }));

    await db.insert(auditLog).values(values);

    return { success: true };
  } catch (error) {
    console.error("Create audit log error:", error);
    return { success: false, error: String(error) };
  }
}

export async function getAuditLogsAction(section?: string) {
  try {
    // If section is provided, only return logs for employees in that section
    if (section) {
      // Get employee numbers for this section
      const sectionEmployees = await db.query.payroll.findMany({
        where: eq(payroll.section, section),
        columns: { no: true }
      });
      const employeeNos = sectionEmployees.map(e => e.no);

      if (employeeNos.length === 0) {
        return { success: true, data: [] };
      }

      const logs = await db.query.auditLog.findMany({
        where: inArray(auditLog.employeeNo, employeeNos),
        orderBy: [desc(auditLog.createdAt)]
      });
      return { success: true, data: logs };
    }

    // No section filter — return all (for admin/manager)
    const logs = await db.query.auditLog.findMany({
      orderBy: [desc(auditLog.createdAt)]
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error("Get audit logs error:", error);
    return { success: false, error: String(error) };
  }
}
