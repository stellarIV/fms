"use server";

import { db } from "@/db";
import { expenseRequest, managerLetter, purchaseOrder } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// ─── School Manager: Get all pending expense requests ────────────────────────

export async function getSchoolManagerOrdersAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "school_manager") {
      return { success: false, error: "Unauthorized" };
    }
    const requests = await db.query.expenseRequest.findMany({
      where: eq(expenseRequest.status, "Pending"),
      with: { managerLetter: true },
      orderBy: [desc(expenseRequest.createdAt)],
    });
    return { success: true, data: requests };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── School Manager: Save/Send Manager Letter ────────────────────────────────

type ManagerLetterData = {
  addressedTo: string;
  responsiblePerson: string;
  amountToBuy: number;
  measure: string;
  targetSection: string;
  purpose: string;
  payAmount: number;
  refNumber?: string;
};

export async function saveManagerLetterAction(
  expenseRequestId: string,
  data: ManagerLetterData,
  send: boolean = false
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "school_manager") {
      return { success: false, error: "Unauthorized" };
    }
    const existing = await db.query.managerLetter.findFirst({
      where: eq(managerLetter.expenseRequestId, expenseRequestId),
    });
    const { randomUUID } = await import("crypto");
    const status = send ? "Sent" : "Draft";
    if (existing) {
      await db.update(managerLetter)
        .set({ ...data, status, updatedAt: new Date() })
        .where(eq(managerLetter.expenseRequestId, expenseRequestId));
    } else {
      await db.insert(managerLetter).values({
        id: randomUUID(),
        expenseRequestId,
        ...data,
        status,
      });
    }
    revalidatePath("/school-manager/purchase-orders");
    revalidatePath("/accountant/expenses/orders");
    revalidatePath("/finance-head/expenses/orders");
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ─── Finance Head: Get all pending expense requests with related data ───────

export async function getPendingExpenseRequestsAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "finance_head") {
      return { success: false, error: "Unauthorized" };
    }

    const requests = await db.query.expenseRequest.findMany({
      where: eq(expenseRequest.status, "Pending"),
      with: {
        managerLetter: true,
        purchaseOrder: true,
      },
      orderBy: [desc(expenseRequest.createdAt)],
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("getPendingExpenseRequestsAction error:", error);
    return { success: false, error: String(error) };
  }
}

// ─── Finance Head: Get all approved expense requests with related data ──────
export async function getApprovedExpenseRequestsAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "finance_head") {
      return { success: false, error: "Unauthorized" };
    }

    const requests = await db.query.expenseRequest.findMany({
      where: eq(expenseRequest.status, "Approved"),
      with: {
        managerLetter: true,
        purchaseOrder: true,
      },
      orderBy: [desc(expenseRequest.updatedAt)],
    });

    return { success: true, data: requests };
  } catch (error) {
    console.error("getApprovedExpenseRequestsAction error:", error);
    return { success: false, error: String(error) };
  }
}

// ─── Accountant: Get all pending expense requests with related data ──────────

export async function getAccountantPurchaseOrdersAction() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return { success: false, error: "Unauthorized" };
    }

    const requests = await db.query.expenseRequest.findMany({
      where: eq(expenseRequest.status, "Pending"),
      with: {
        managerLetter: true,
        purchaseOrder: true,
      },
      orderBy: [desc(expenseRequest.createdAt)],
    });

    // Enforce gate: Accountant only sees requests where Manager Letter is Sent
    const filtered = requests.filter(r => r.managerLetter?.status === "Sent");

    return { success: true, data: filtered };
  } catch (error) {
    console.error("getAccountantPurchaseOrdersAction error:", error);
    return { success: false, error: String(error) };
  }
}


// ─── Accountant: Save / Update Purchase Order (Paper 3) ─────────────────────

type PurchaseOrderData = {
  addressedTo?: string;
  responsiblePerson?: string;
  targetSection?: string;
  purpose?: string;
  itemDescription?: string;
  measure?: string;
  quantity?: number;
  unitPrice?: number;
  totalAmount?: number;
  paymentMethod?: string;
  receiptNumber?: string;
  notes?: string;
};

export async function savePurchaseOrderAction(
  expenseRequestId: string,
  data: PurchaseOrderData
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db.query.purchaseOrder.findFirst({
      where: eq(purchaseOrder.expenseRequestId, expenseRequestId),
    });

    const { randomUUID } = await import("crypto");

    if (existing) {
      await db
        .update(purchaseOrder)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(purchaseOrder.expenseRequestId, expenseRequestId));
    } else {
      await db.insert(purchaseOrder).values({
        id: randomUUID(),
        expenseRequestId,
        ...data,
        status: "Draft",
      });
    }

    revalidatePath("/accountant/expenses/orders");
    revalidatePath("/finance-head/expenses/orders");
    return { success: true };
  } catch (error) {
    console.error("savePurchaseOrderAction error:", error);
    return { success: false, error: String(error) };
  }
}

// ─── Accountant: Submit Purchase Order for Finance Head review ───────────────

export async function submitPurchaseOrderAction(expenseRequestId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "accountant") {
      return { success: false, error: "Unauthorized" };
    }

    const existing = await db.query.purchaseOrder.findFirst({
      where: eq(purchaseOrder.expenseRequestId, expenseRequestId),
    });

    if (!existing) return { success: false, error: "Purchase order not found. Please save it first." };
    if (existing.status === "Submitted") return { success: false, error: "Already submitted." };

    await db
      .update(purchaseOrder)
      .set({ status: "Submitted", updatedAt: new Date() })
      .where(eq(purchaseOrder.expenseRequestId, expenseRequestId));

    revalidatePath("/accountant/expenses/orders");
    revalidatePath("/finance-head/expenses/orders");
    return { success: true };
  } catch (error) {
    console.error("submitPurchaseOrderAction error:", error);
    return { success: false, error: String(error) };
  }
}

// ─── Finance Head: Approve a purchase order (marks expense request Approved) ─

export async function approvePurchaseOrderAction(expenseRequestId: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "finance_head") {
      return { success: false, error: "Unauthorized" };
    }

    // Verify manager letter exists and is sent
    const ml = await db.query.managerLetter.findFirst({
      where: eq(managerLetter.expenseRequestId, expenseRequestId),
    });
    if (!ml || ml.status !== "Sent") return { success: false, error: "School Manager must send the authorization letter first." };

    // Verify purchase order exists and is submitted
    const po = await db.query.purchaseOrder.findFirst({
      where: eq(purchaseOrder.expenseRequestId, expenseRequestId),
    });
    if (!po) return { success: false, error: "Purchase order has not been filled by accountant yet." };
    if (po.status !== "Submitted") return { success: false, error: "Purchase order must be submitted by accountant before approval." };

    await db
      .update(purchaseOrder)
      .set({ status: "Approved", updatedAt: new Date() })
      .where(eq(purchaseOrder.expenseRequestId, expenseRequestId));

    await db
      .update(expenseRequest)
      .set({ status: "Approved", updatedAt: new Date() })
      .where(eq(expenseRequest.id, expenseRequestId));

    revalidatePath("/finance-head/expenses/orders");
    revalidatePath("/accountant/expenses/orders");
    revalidatePath("/principal/expense-request");
    return { success: true };
  } catch (error) {
    console.error("approvePurchaseOrderAction error:", error);
    return { success: false, error: String(error) };
  }
}


// ─── Finance Head: Reject a purchase order ───────────────────────────────────

export async function rejectPurchaseOrderAction(expenseRequestId: string, reason: string) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "finance_head") {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(expenseRequest)
      .set({ status: "Rejected", evaluation: reason, updatedAt: new Date() })
      .where(eq(expenseRequest.id, expenseRequestId));

    revalidatePath("/finance-head/expenses/orders");
    revalidatePath("/principal/expense-request");
    return { success: true };
  } catch (error) {
    console.error("rejectPurchaseOrderAction error:", error);
    return { success: false, error: String(error) };
  }
}
