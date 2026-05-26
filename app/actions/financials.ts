"use server";

import { db } from "@/db";
import { budget, manualJournalEntry, monthlyPayment, purchaseOrder, payroll } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { CHART_OF_ACCOUNTS } from "@/lib/financials-config";
import type { LedgerTransaction, TrialBalanceRow, FinancialStatements } from "@/lib/financials-config";

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function getAccountFromObjectType(objectType: string = "", description: string = ""): string {
  const text = (objectType + " " + description).toLowerCase();
  if (text.includes("stationery") || text.includes("paper") || text.includes("pen") || text.includes("book") || text.includes("print")) return "5100";
  if (text.includes("hardware") || text.includes("cement") || text.includes("wood") || text.includes("metal") || text.includes("construction")) return "5200";
  if (text.includes("utility") || text.includes("water") || text.includes("electric") || text.includes("telecom") || text.includes("internet") || text.includes("power")) return "5300";
  if (text.includes("maintenance") || text.includes("repair") || text.includes("paint") || text.includes("fix") || text.includes("renovate")) return "5400";
  if (text.includes("transport") || text.includes("logistics") || text.includes("fuel") || text.includes("bus") || text.includes("car")) return "5500";
  if (text.includes("asset") || text.includes("computer") || text.includes("furniture") || text.includes("chair") || text.includes("desk") || text.includes("table") || text.includes("projector") || text.includes("laptop")) return "1500";
  return "5900";
}

function getCategoryFromAccountCode(code: string): string {
  if (code === "5000") return "payroll";
  if (code === "5100") return "stationery";
  if (code === "5200") return "hardware";
  if (code === "5300") return "utility";
  if (code === "5400") return "maintenance";
  if (code === "5500") return "transport";
  if (code === "1500") return "assets";
  return "other";
}

// ─── Budget Actions ──────────────────────────────────────────────────────────

export async function getBudgetsAction(year: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthorized" };

    let results = await db.query.budget.findMany({ where: eq(budget.year, year) });

    if (results.length === 0) {
      const { randomUUID } = await import("crypto");
      const defaults = [
        { category: "payroll",     allocated: 2400000 },
        { category: "stationery",  allocated: 150000  },
        { category: "hardware",    allocated: 300000  },
        { category: "utility",     allocated: 120000  },
        { category: "maintenance", allocated: 200000  },
        { category: "transport",   allocated: 450000  },
        { category: "assets",      allocated: 800000  },
        { category: "other",       allocated: 100000  },
      ];
      await db.insert(budget).values(defaults.map(d => ({ id: randomUUID(), year, ...d })));
      results = await db.query.budget.findMany({ where: eq(budget.year, year) });
    }

    return { success: true, data: results };
  } catch (error) {
    console.error("getBudgetsAction error:", error);
    return { success: false, error: String(error) };
  }
}

export async function saveBudgetsAction(year: number, allocations: Array<{ category: string; allocated: number }>) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role !== "school_manager") {
      return { success: false, error: "Only the School Manager can modify budget ceilings." };
    }

    const { randomUUID } = await import("crypto");

    for (const alloc of allocations) {
      const existing = await db.query.budget.findFirst({
        where: and(eq(budget.year, year), eq(budget.category, alloc.category)),
      });
      if (existing) {
        await db.update(budget).set({ allocated: alloc.allocated, updatedAt: new Date() }).where(eq(budget.id, existing.id));
      } else {
        await db.insert(budget).values({ id: randomUUID(), category: alloc.category, allocated: alloc.allocated, year });
      }
    }

    revalidatePath("/school-manager/budget-plan");
    revalidatePath("/accountant/ledger");
    revalidatePath("/finance-head/ledger");
    return { success: true };
  } catch (error) {
    console.error("saveBudgetsAction error:", error);
    return { success: false, error: String(error) };
  }
}

// ─── Manual Journal Entry ────────────────────────────────────────────────────

export async function addManualJournalEntryAction(data: {
  description: string;
  accountCode: string;
  debit: number;
  credit: number;
  reference?: string;
  date?: Date;
}) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user.role !== "accountant" && session.user.role !== "school_manager")) {
      return { success: false, error: "Unauthorized." };
    }

    if (!CHART_OF_ACCOUNTS[data.accountCode]) {
      return { success: false, error: `Invalid account code: ${data.accountCode}` };
    }

    const { randomUUID } = await import("crypto");
    await db.insert(manualJournalEntry).values({
      id: randomUUID(),
      description: data.description,
      accountCode: data.accountCode,
      debit: data.debit,
      credit: data.credit,
      reference: data.reference || "JV-MANUAL",
      date: data.date || new Date(),
    });

    revalidatePath("/school-manager/budget-plan");
    revalidatePath("/accountant/ledger");
    revalidatePath("/accountant/revenue/dashboard");
    revalidatePath("/principal/dashboard");
    return { success: true };
  } catch (error) {
    console.error("addManualJournalEntryAction error:", error);
    return { success: false, error: String(error) };
  }
}

// ─── General Ledger Compiler ──────────────────────────────────────────────────

export async function getGeneralLedgerAction(year: number) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return { success: false, error: "Unauthorized" };

    const ledger: LedgerTransaction[] = [];

    // 1. Student Payments → Revenue entries
    const payments = await db.query.monthlyPayment.findMany({
      where: eq(monthlyPayment.year, year),
      with: { student: true },
    });

    for (const p of payments) {
      const date = p.bankDate || p.createdAt || new Date();
      const ref = p.receiptNumber || `RE-TEMP-${p.id.slice(0, 6)}`;
      const studentName = p.student?.name || "Student";

      const tuition      = p.tuitionFee      || 0;
      const transport    = p.transportFee    || 0;
      const penalty      = p.penaltyFee      || 0;
      const registration = p.registrationFee || 0;
      const library      = p.libraryFee      || 0;
      const total = tuition + transport + penalty + registration + library;

      if (total === 0) continue;

      ledger.push({ id: `${p.id}-cash`, date, description: `Revenue Collection: ${studentName} - Month: ${p.month}`, reference: ref, accountCode: "1000", accountName: CHART_OF_ACCOUNTS["1000"].name, accountType: "Asset", debit: total, credit: 0, type: "automated" });
      if (tuition      > 0) ledger.push({ id: `${p.id}-tuition`,  date, description: `Tuition Fee Revenue - ${studentName}`,         reference: ref, accountCode: "4000", accountName: CHART_OF_ACCOUNTS["4000"].name, accountType: "Revenue", debit: 0, credit: tuition,      type: "automated" });
      if (transport    > 0) ledger.push({ id: `${p.id}-transport`, date, description: `Transport Service Revenue - ${studentName}`,   reference: ref, accountCode: "4100", accountName: CHART_OF_ACCOUNTS["4100"].name, accountType: "Revenue", debit: 0, credit: transport,    type: "automated" });
      if (penalty      > 0) ledger.push({ id: `${p.id}-penalty`,   date, description: `Late Payment Penalty Revenue - ${studentName}`,reference: ref, accountCode: "4200", accountName: CHART_OF_ACCOUNTS["4200"].name, accountType: "Revenue", debit: 0, credit: penalty,      type: "automated" });
      if (registration > 0) ledger.push({ id: `${p.id}-reg`,       date, description: `Registration Fee Revenue - ${studentName}`,    reference: ref, accountCode: "4300", accountName: CHART_OF_ACCOUNTS["4300"].name, accountType: "Revenue", debit: 0, credit: registration, type: "automated" });
      if (library      > 0) ledger.push({ id: `${p.id}-lib`,       date, description: `Library Fee Revenue - ${studentName}`,         reference: ref, accountCode: "4400", accountName: CHART_OF_ACCOUNTS["4400"].name, accountType: "Revenue", debit: 0, credit: library,      type: "automated" });
    }

    // 2. Approved Purchase Orders → Expense entries
    const pos = await db.query.purchaseOrder.findMany({
      where: eq(purchaseOrder.status, "Approved"),
      with: { expenseRequest: true },
    });

    for (const po of pos) {
      const date   = po.updatedAt || po.createdAt || new Date();
      const amount = po.totalAmount || 0;
      if (amount === 0) continue;

      const objectType = po.expenseRequest?.objectType || "";
      const itemDesc   = po.itemDescription || po.expenseRequest?.objectDescription || "Procurement Item";
      const purpose    = po.purpose || po.expenseRequest?.requestPurpose || "School Operations";
      const receipt    = po.receiptNumber || "N/A";
      const code       = getAccountFromObjectType(objectType, itemDesc);

      ledger.push({ id: `${po.id}-debit`,  date, description: `Procurement: ${itemDesc} (${purpose})`,      reference: `PO #${po.expenseRequestId.slice(0, 8)}`, accountCode: code,   accountName: CHART_OF_ACCOUNTS[code].name,   accountType: CHART_OF_ACCOUNTS[code].type,   debit: amount, credit: 0,      type: "automated" });
      ledger.push({ id: `${po.id}-credit`, date, description: `Disbursement for PO - Receipt #${receipt}`, reference: `PO #${po.expenseRequestId.slice(0, 8)}`, accountCode: "1000", accountName: CHART_OF_ACCOUNTS["1000"].name, accountType: "Asset",                        debit: 0,      credit: amount, type: "automated" });
    }

    // 3. Payroll → Salary expense entries
    const salarySheets = await db.query.payroll.findMany();

    for (const sheet of salarySheets) {
      const date   = sheet.createdAt || new Date();
      const amount = sheet.grossSalary || sheet.basicSalary || 0;
      if (amount === 0) continue;

      ledger.push({ id: `${sheet.id}-debit`,  date, description: `Payroll Disbursement: ${sheet.name} (${sheet.position})`, reference: `PAY-${sheet.no}`, accountCode: "5000", accountName: CHART_OF_ACCOUNTS["5000"].name, accountType: "Expense", debit: amount, credit: 0,      type: "automated" });
      ledger.push({ id: `${sheet.id}-credit`, date, description: `Cash Payment - Payroll #${sheet.no}`,                    reference: `PAY-${sheet.no}`, accountCode: "1000", accountName: CHART_OF_ACCOUNTS["1000"].name, accountType: "Asset",   debit: 0,      credit: amount, type: "automated" });
    }

    // 4. Manual Journal Entries
    const manualEntries = await db.query.manualJournalEntry.findMany({
      orderBy: [asc(manualJournalEntry.date)],
    });

    for (const m of manualEntries) {
      ledger.push({
        id: m.id,
        date: m.date,
        description: m.description,
        reference: m.reference || "JV-MANUAL",
        accountCode: m.accountCode,
        accountName: CHART_OF_ACCOUNTS[m.accountCode]?.name || "Custom Account",
        accountType: CHART_OF_ACCOUNTS[m.accountCode]?.type || "Asset",
        debit: m.debit,
        credit: m.credit,
        type: "manual",
      });
    }

    ledger.sort((a, b) => a.date.getTime() - b.date.getTime());

    return { success: true, data: ledger };
  } catch (error) {
    console.error("getGeneralLedgerAction error:", error);
    return { success: false, error: String(error) };
  }
}

// ─── Financial Statements ─────────────────────────────────────────────────────

export async function getFinancialStatementsAction(year: number) {
  try {
    const ledgerResult = await getGeneralLedgerAction(year);
    if (!ledgerResult.success || !ledgerResult.data) {
      return { success: false, error: ledgerResult.error || "Failed to load general ledger" };
    }

    const ledger       = ledgerResult.data;
    const budgetsResult = await getBudgetsAction(year);
    const budgets       = budgetsResult.success && budgetsResult.data ? budgetsResult.data : [];

    // Seed opening balances
    const accountsMap: Record<string, { debit: number; credit: number }> = {};
    for (const code of Object.keys(CHART_OF_ACCOUNTS)) {
      accountsMap[code] = { debit: 0, credit: 0 };
    }
    accountsMap["1000"].debit  += 1850000; // Base cash reserve
    accountsMap["1500"].debit  += 3200000; // School buildings & bus
    accountsMap["3000"].credit += 5050000; // Retained Earnings / Equity

    for (const tx of ledger) {
      if (!accountsMap[tx.accountCode]) accountsMap[tx.accountCode] = { debit: 0, credit: 0 };
      accountsMap[tx.accountCode].debit  += tx.debit;
      accountsMap[tx.accountCode].credit += tx.credit;
    }

    // ─── Trial Balance ────────────────────────────────────────────────────────
    const trialBalance: TrialBalanceRow[] = Object.entries(accountsMap).map(([code, bal]) => {
      const meta = CHART_OF_ACCOUNTS[code] || { name: "Custom Account", type: "Asset" as const };
      const net  = bal.debit - bal.credit;
      let netDebit = 0, netCredit = 0;
      if (meta.type === "Asset" || meta.type === "Expense") {
        if (net >= 0) netDebit = net; else netCredit = Math.abs(net);
      } else {
        if (net <= 0) netCredit = Math.abs(net); else netDebit = net;
      }
      return { code, name: meta.name, type: meta.type, totalDebit: bal.debit, totalCredit: bal.credit, netDebit, netCredit };
    }).sort((a, b) => a.code.localeCompare(b.code));

    // ─── Income Statement ─────────────────────────────────────────────────────
    const revenues = trialBalance.filter(r => r.type === "Revenue").map(r => ({ name: r.name, code: r.code, amount: r.netCredit }));
    const expenses = trialBalance.filter(r => r.type === "Expense").map(r => ({ name: r.name, code: r.code, amount: r.netDebit }));
    const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const netIncome    = totalRevenue - totalExpense;

    // ─── Balance Sheet ────────────────────────────────────────────────────────
    const assets      = trialBalance.filter(r => r.type === "Asset").map(r => ({ name: r.name, code: r.code, amount: r.netDebit - r.netCredit }));
    const liabilities = trialBalance.filter(r => r.type === "Liability").map(r => ({ name: r.name, code: r.code, amount: r.netCredit - r.netDebit }));
    const baseEquityRow = trialBalance.find(r => r.code === "3000");
    const baseEquity    = baseEquityRow ? baseEquityRow.netCredit - baseEquityRow.netDebit : 0;
    const equity = [
      { name: "Initial Retained Earnings & Capital", code: "3000", amount: baseEquity },
      { name: "Current Year Net Income / Surplus",   code: "INC",  amount: netIncome  },
    ];
    const totalAssets      = assets.reduce((s, a) => s + a.amount, 0);
    const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
    const totalEquity      = equity.reduce((s, e) => s + e.amount, 0);

    // ─── Budget vs Actual ─────────────────────────────────────────────────────
    const categorySpent: Record<string, number> = {};
    for (const tx of ledger) {
      if (tx.debit > 0 && (tx.accountType === "Expense" || tx.accountCode === "1500")) {
        const cat = getCategoryFromAccountCode(tx.accountCode);
        categorySpent[cat] = (categorySpent[cat] || 0) + tx.debit;
      }
    }

    const budgetVsActual = budgets.map(b => {
      const actual     = categorySpent[b.category] || 0;
      const percentage = b.allocated > 0 ? parseFloat(((actual / b.allocated) * 100).toFixed(1)) : 0;
      return { category: b.category, allocated: b.allocated, actual, remaining: b.allocated - actual, percentage };
    });

    return {
      success: true,
      data: {
        trialBalance,
        incomeStatement: { revenues, expenses, totalRevenue, totalExpense, netIncome },
        balanceSheet: {
          assets,
          liabilities,
          equity,
          totalAssets,
          totalLiabilities,
          totalEquity: totalLiabilities + totalEquity === totalAssets ? totalEquity : totalAssets - totalLiabilities,
        },
        budgetVsActual,
      } as FinancialStatements,
    };
  } catch (error) {
    console.error("getFinancialStatementsAction error:", error);
    return { success: false, error: String(error) };
  }
}
