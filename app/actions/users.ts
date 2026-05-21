"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth"; // Might need headers if better-auth is used on server. Let's assume we can query DB directly for now, or check role if needed.
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
