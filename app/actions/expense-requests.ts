"use server";

import { db } from "@/db";
import { expenseRequest } from "@/db/schema";
import { eq, and, desc, max } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

type CreateRequestData = {
  objectType: string;
  objectDescription: string;
  measure: string;
  requestPurpose: string;
  quantity: number;
};

export async function getExpenseRequestsAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user.role?.startsWith("principal")) {
      return { success: false, error: "Unauthorized" };
    }

    const requests = await db.query.expenseRequest.findMany({
      where: eq(expenseRequest.requesterId, session.user.id),
      orderBy: [desc(expenseRequest.createdAt)],
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("getExpenseRequestsAction error:", error);
    return { success: false, error: String(error) };
  }
}

export async function createExpenseRequestAction(data: CreateRequestData) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user.role?.startsWith("principal")) {
      return { success: false, error: "Unauthorized" };
    }

    const crypto = await import("crypto");
    
    // Get max 'no' to auto-increment
    const maxNoResult = await db.select({ value: max(expenseRequest.no) }).from(expenseRequest);
    const nextNo = (maxNoResult[0]?.value || 0) + 1;

    const newRequest = {
      id: crypto.randomUUID(),
      no: nextNo,
      ...data,
      requesterId: session.user.id,
      status: "Draft",
    };

    await db.insert(expenseRequest).values(newRequest);
    return { success: true };
  } catch (error) {
    console.error("createExpenseRequestAction error:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateExpenseRequestAction(id: string, data: Partial<CreateRequestData>) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user.role?.startsWith("principal")) {
      return { success: false, error: "Unauthorized" };
    }

    // Ensure it's in Draft state before allowing update
    const existing = await db.query.expenseRequest.findFirst({
      where: and(eq(expenseRequest.id, id), eq(expenseRequest.requesterId, session.user.id)),
    });

    if (!existing) return { success: false, error: "Request not found" };
    if (existing.status !== "Draft") return { success: false, error: "Only Draft requests can be edited" };

    await db.update(expenseRequest)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(expenseRequest.id, id));

    return { success: true };
  } catch (error) {
    console.error("updateExpenseRequestAction error:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteExpenseRequestAction(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user.role?.startsWith("principal")) {
      return { success: false, error: "Unauthorized" };
    }

    // Ensure it's in Draft state before allowing delete
    const existing = await db.query.expenseRequest.findFirst({
      where: and(eq(expenseRequest.id, id), eq(expenseRequest.requesterId, session.user.id)),
    });

    if (!existing) return { success: false, error: "Request not found" };
    if (existing.status !== "Draft") return { success: false, error: "Only Draft requests can be deleted" };

    await db.delete(expenseRequest).where(eq(expenseRequest.id, id));

    return { success: true };
  } catch (error) {
    console.error("deleteExpenseRequestAction error:", error);
    return { success: false, error: String(error) };
  }
}

export async function submitExpenseRequestAction(id: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || !session.user.role?.startsWith("principal")) {
      return { success: false, error: "Unauthorized" };
    }

    // Change status from Draft to Pending
    const existing = await db.query.expenseRequest.findFirst({
      where: and(eq(expenseRequest.id, id), eq(expenseRequest.requesterId, session.user.id)),
    });

    if (!existing) return { success: false, error: "Request not found" };
    if (existing.status !== "Draft") return { success: false, error: "Only Draft requests can be submitted" };

    await db.update(expenseRequest)
      .set({ status: "Pending", updatedAt: new Date() })
      .where(eq(expenseRequest.id, id));

    return { success: true };
  } catch (error) {
    console.error("submitExpenseRequestAction error:", error);
    return { success: false, error: String(error) };
  }
}
