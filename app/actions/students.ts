"use server";

import { db } from "@/db";
import { student } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function updateStudentNameAction(studentId: string, newName: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user.role?.startsWith("principal")) {
      return { success: false, error: "Unauthorized" };
    }

    const trimmed = newName.trim();
    if (!trimmed) {
      return { success: false, error: "Name cannot be empty" };
    }

    await db.update(student)
      .set({ name: trimmed, updatedAt: new Date() })
      .where(eq(student.id, studentId));

    return { success: true };
  } catch (error) {
    console.error("updateStudentNameAction error:", error);
    return { success: false, error: String(error) };
  }
}
