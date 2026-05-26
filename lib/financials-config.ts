// ─── Chart Of Accounts ───────────────────────────────────────────────────────
// This file is intentionally NOT a "use server" file so it can export
// plain objects and types freely — imported by both server actions and
// client components.

export const CHART_OF_ACCOUNTS: Record<
  string,
  { name: string; type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense" }
> = {
  "1000": { name: "Cash at Bank", type: "Asset" },
  "1100": { name: "Accounts Receivable (Student Fees)", type: "Asset" },
  "1500": { name: "Fixed & Capital Assets (Equipment, Buildings)", type: "Asset" },
  "2000": { name: "Accounts Payable (Pending Invoices)", type: "Liability" },
  "3000": { name: "Owner's Equity & Retained Earnings", type: "Equity" },
  "4000": { name: "Student Tuition Revenue", type: "Revenue" },
  "4100": { name: "Student Transport Revenue", type: "Revenue" },
  "4200": { name: "Student Penalty Revenue", type: "Revenue" },
  "4300": { name: "Student Registration Revenue", type: "Revenue" },
  "4400": { name: "Student Library Fee Revenue", type: "Revenue" },
  "5000": { name: "Salaries and Payroll Expense", type: "Expense" },
  "5100": { name: "Procurement Expense - Stationery", type: "Expense" },
  "5200": { name: "Procurement Expense - Hardware", type: "Expense" },
  "5300": { name: "Procurement Expense - Utilities & Operations", type: "Expense" },
  "5400": { name: "Procurement Expense - Maintenance", type: "Expense" },
  "5500": { name: "Procurement Expense - Transport & Logistics", type: "Expense" },
  "5900": { name: "Procurement Expense - Other/Misc", type: "Expense" },
};

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type LedgerTransaction = {
  id: string;
  date: Date;
  description: string;
  reference: string;
  accountCode: string;
  accountName: string;
  accountType: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense";
  debit: number;
  credit: number;
  type: "automated" | "manual";
};

export type TrialBalanceRow = {
  code: string;
  name: string;
  type: string;
  totalDebit: number;
  totalCredit: number;
  netDebit: number;
  netCredit: number;
};

export type FinancialStatements = {
  trialBalance: TrialBalanceRow[];
  incomeStatement: {
    revenues: Array<{ name: string; code: string; amount: number }>;
    expenses: Array<{ name: string; code: string; amount: number }>;
    totalRevenue: number;
    totalExpense: number;
    netIncome: number;
  };
  balanceSheet: {
    assets: Array<{ name: string; code: string; amount: number }>;
    liabilities: Array<{ name: string; code: string; amount: number }>;
    equity: Array<{ name: string; code: string; amount: number }>;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
  };
  budgetVsActual: Array<{
    category: string;
    allocated: number;
    actual: number;
    remaining: number;
    percentage: number;
  }>;
};
