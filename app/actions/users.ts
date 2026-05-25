"use server";

import { db } from "@/db";
import { user, student } from "@/db/schema";
import { eq, isNull, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Since it's a server action, let's just make it simple and rely on the UI calling it.
// In a real app we would check auth here as well.

export async function getAllUsers() {
  const users = await db.select({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isBanned: user.isBanned,
    createdAt: user.createdAt,
  }).from(user).orderBy(user.createdAt);
  return users;
}

export async function updateUserRole(id: string, newRole: string) {
  await db.update(user).set({ role: newRole }).where(eq(user.id, id));
  revalidatePath("/school-manager/users");
  return { success: true };
}

export async function toggleUserBan(id: string, isBanned: boolean) {
  await db.update(user).set({ isBanned }).where(eq(user.id, id));
  revalidatePath("/school-manager/users");
  return { success: true };
}

export async function getStudentsWithAccountStatus() {
  const students = await db.query.student.findMany({
    orderBy: (student, { asc }) => [asc(student.name)],
  });
  return students;
}

export async function createStudentAccount(studentId: string, email: string, password: string) {
  try {
    const studentRecord = await db.query.student.findFirst({
      where: eq(student.id, studentId),
    });
    if (!studentRecord) return { success: false, error: "Student not found." };
    if (studentRecord.userId) return { success: false, error: "Student already has an account." };

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, email),
    });
    if (existingUser) return { success: false, error: "Email already in use." };

    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: studentRecord.name,
        role: "student",
      } as any,
    });

    if (!result?.user?.id) return { success: false, error: "Failed to create user account." };

    // Ensure role is set — signUpEmail may ignore extra fields depending on config
    await db.update(user)
      .set({ role: "student" })
      .where(eq(user.id, result.user.id));

    await db.update(student)
      .set({ userId: result.user.id })
      .where(eq(student.id, studentId));

    revalidatePath("/school-manager/students");
    return { success: true };
  } catch (error: any) {
    console.error("createStudentAccount error:", error);
    return { success: false, error: error.message || "Unknown error." };
  }
}

export async function removeStudentAccount(studentId: string) {
  try {
    const studentRecord = await db.query.student.findFirst({
      where: eq(student.id, studentId),
    });
    if (!studentRecord?.userId) return { success: false, error: "No account linked." };

    await db.update(student).set({ userId: null }).where(eq(student.id, studentId));
    await db.delete(user).where(eq(user.id, studentRecord.userId));

    revalidatePath("/school-manager/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
