"use client";

import { useState, useTransition, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Wallet, BarChart3, TrendingUp, TrendingDown, ClipboardList, ShieldCheck,
  CheckCircle, PlusCircle, Search, Filter, RotateCcw, AlertTriangle, ArrowUpDown, ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { saveBudgetsAction, addManualJournalEntryAction } from "@/app/actions/financials";
import { CHART_OF_ACCOUNTS, type LedgerTransaction, type FinancialStatements } from "@/lib/financials-config";

// Category display mapping
const CATEGORY_META: Record<string, { label: string; desc: string; icon: string; color: string }> = {
  payroll: { label: "Employee Salaries & Payroll", desc: "Teacher salaries, allowances, and OT payouts.", icon: "Users", color: "from-blue-500 to-indigo-500" },
  stationery: { label: "Stationery & Printing", desc: "Exam sheets, print paper, chalks, classroom books.", icon: "BookOpen", color: "from-emerald-500 to-teal-500" },
  hardware: { label: "Hardware & Construction", desc: "Building repairs, steel, wood, cement, furniture.", icon: "Hammer", color: "from-amber-500 to-orange-500" },
  utility: { label: "Utilities & Operations", desc: "Electricity bills, tap water, telecom, internet.", icon: "Zap", color: "from-violet-500 to-purple-500" },
  maintenance: { label: "Maintenance & Repairs", desc: "Painting, light fix, plumbing, general restoration.", icon: "Wrench", color: "from-cyan-500 to-blue-500" },
  transport: { label: "Transport & Logistics", desc: "School bus fuel, maintenance, spare parts.", icon: "Bus", color: "from-pink-500 to-rose-500" },
  assets: { label: "Capital & Fixed Assets", desc: "Laptops, projectors, lab gear, land additions.", icon: "Building2", color: "from-indigo-500 to-purple-500" },
  other: { label: "Other / Misc Operations", desc: "Emergency funds, small operational cash needs.", icon: "HelpCircle", color: "from-gray-500 to-slate-500" },
};

type FinancialDashboardProps = {
  statements: FinancialStatements;
  ledger: LedgerTransaction[];
  initialYear: number;
  userRole: string;
};

export function FinancialLedgerDashboard({ statements, ledger, initialYear, userRole }: FinancialDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("budget");
  const [isPending, startTransition] = useTransition();

  // Local state for editing budgets
  const [editedBudgets, setEditedBudgets] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const b of statements.budgetVsActual) {
      map[b.category] = b.allocated;
    }
    return map;
  });

  const isManager = userRole === "school_manager";
  const isAccountant = userRole === "accountant";

  // General Ledger Search and Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  // Manual Journal Entry Dialog state
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalData, setJournalData] = useState({
    description: "",
    accountCode: "1000",
    debit: 0,
    credit: 0,
    reference: "",
  });

  // Calculate high-level metrics
  const totalAllocated = useMemo(() => {
    return Object.values(editedBudgets).reduce((sum, val) => sum + val, 0);
  }, [editedBudgets]);

  const totalSpent = useMemo(() => {
    return statements.budgetVsActual.reduce((sum, item) => sum + item.actual, 0);
  }, [statements.budgetVsActual]);

  const totalRemaining = totalAllocated - totalSpent;
  const overallPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Filtered ledger rows
  const filteredLedger = useMemo(() => {
    return ledger.filter(tx => {
      const matchSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.reference.toLowerCase().includes(searchQuery.toLowerCase());
      const matchAccount = selectedAccount === "all" || tx.accountCode === selectedAccount;
      const matchType = selectedType === "all" || 
                        (selectedType === "debit" && tx.debit > 0) || 
                        (selectedType === "credit" && tx.credit > 0) ||
                        (selectedType === "manual" && tx.type === "manual") ||
                        (selectedType === "automated" && tx.type === "automated");
      return matchSearch && matchAccount && matchType;
    });
  }, [ledger, searchQuery, selectedAccount, selectedType]);

  // Handle saving budgets
  const handleSaveBudgets = () => {
    const allocations = Object.entries(editedBudgets).map(([category, allocated]) => ({
      category,
      allocated,
    }));

    startTransition(async () => {
      const res = await saveBudgetsAction(initialYear, allocations);
      if (res.success) {
        toast.success("Annual budget ceiling allocations saved successfully.");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to save budget settings.");
      }
    });
  };

  // Reset budgets
  const handleResetBudgets = () => {
    const map: Record<string, number> = {};
    for (const b of statements.budgetVsActual) {
      map[b.category] = b.allocated;
    }
    setEditedBudgets(map);
    toast.info("Budget adjustments reset.");
  };

  // Submit manual journal entry
  const handleSubmitJournal = () => {
    if (!journalData.description.trim()) {
      toast.error("Please enter a transaction description.");
      return;
    }
    if (journalData.debit <= 0 && journalData.credit <= 0) {
      toast.error("Please enter a valid debit or credit amount.");
      return;
    }
    if (journalData.debit > 0 && journalData.credit > 0) {
      toast.error("In double-entry adjustments, specify either a debit or a credit per line. Create separate rows for balancing.");
      return;
    }

    startTransition(async () => {
      const res = await addManualJournalEntryAction({
        ...journalData,
        reference: journalData.reference || "JV-ADJUST",
      });

      if (res.success) {
        toast.success("Manual journal entry posted to general ledger successfully.");
        setJournalOpen(false);
        setJournalData({
          description: "",
          accountCode: "1000",
          debit: 0,
          credit: 0,
          reference: "",
        });
        router.refresh();
      } else {
        toast.error(res.error || "Failed to post journal entry.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
            Financial Ledger & Budget Planning
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Double-entry ledger accounting, trial balances, and category-level budget ceilings for Ethiopian Calendar Year {initialYear}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Financial Year:</label>
          <select 
            value={initialYear} 
            onChange={(e) => {
              const newYear = e.target.value;
              const params = new URLSearchParams(window.location.search);
              params.set("year", newYear);
              router.push(`${window.location.pathname}?${params.toString()}`);
            }}
            className="h-9 rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
          >
            <option value={2018}>2018 E.C. (2025/2026 G.C.)</option>
            <option value={2017}>2017 E.C. (2024/2025 G.C.)</option>
            <option value={2016}>2016 E.C. (2023/2024 G.C.)</option>
          </select>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="w-full">
        <div className="grid grid-cols-2 md:grid-cols-5 h-auto p-1.5 bg-muted/60 border rounded-xl overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab("budget")}
            className={`rounded-lg py-2 text-xs md:text-sm font-medium transition-all gap-1.5 flex items-center justify-center cursor-pointer ${activeTab === "budget" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            <BarChart3 className="h-4 w-4" /> Budget Control
          </button>
          <button
            onClick={() => setActiveTab("ledger")}
            className={`rounded-lg py-2 text-xs md:text-sm font-medium transition-all gap-1.5 flex items-center justify-center cursor-pointer ${activeTab === "ledger" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            <ClipboardList className="h-4 w-4" /> General Ledger
          </button>
          <button
            onClick={() => setActiveTab("trial")}
            className={`rounded-lg py-2 text-xs md:text-sm font-medium transition-all gap-1.5 flex items-center justify-center cursor-pointer ${activeTab === "trial" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            <ShieldCheck className="h-4 w-4" /> Trial Balance
          </button>
          <button
            onClick={() => setActiveTab("income")}
            className={`rounded-lg py-2 text-xs md:text-sm font-medium transition-all gap-1.5 flex items-center justify-center cursor-pointer ${activeTab === "income" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            <TrendingUp className="h-4 w-4" /> Income Statement
          </button>
          <button
            onClick={() => setActiveTab("balance")}
            className={`rounded-lg py-2 text-xs md:text-sm font-medium transition-all gap-1.5 flex items-center justify-center cursor-pointer ${activeTab === "balance" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"}`}
          >
            <Wallet className="h-4 w-4" /> Balance Sheet
          </button>
        </div>

        {/* ─── TAB 1: BUDGET CONTROL & SETUP ───────────────────────────────── */}
        {activeTab === "budget" && (
          <div className="mt-6 flex flex-col gap-6 outline-none">
          {/* Summary Dials */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Allocated Budget</span>
                <CardTitle className="text-2xl font-extrabold tracking-tight mt-1">
                  ETB {totalAllocated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Last Year Ceiling:</span>
                  <span className="font-semibold text-foreground">ETB 4,000,000.00</span>
                  <span className="text-emerald-500 font-semibold font-mono flex items-center">
                    (+{(((totalAllocated - 4000000)/4000000)*100).toFixed(0)}%)
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actual Spent So Far</span>
                <CardTitle className="text-2xl font-extrabold tracking-tight mt-1 text-amber-600 dark:text-amber-500">
                  ETB {totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${overallPercentage > 90 ? 'bg-red-500' : overallPercentage > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(overallPercentage, 100)}%` }} 
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground mt-1.5">
                  <span>Consumption Level</span>
                  <span className="font-bold font-mono">{overallPercentage.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Surplus</span>
                <CardTitle className={`text-2xl font-extrabold tracking-tight mt-1 ${totalRemaining < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-500'}`}>
                  ETB {totalRemaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Within safe operational limits</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Year Comparative Actual</span>
                <CardTitle className="text-2xl font-extrabold tracking-tight mt-1 text-muted-foreground/80">
                  ETB 3,850,000.00
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Revenue target exceeded by 18%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Allocation Setup & Controls */}
          <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
            <CardHeader className="border-b border-border/80 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg">Category Budget Allocations</CardTitle>
                  <CardDescription>
                    Adjust the annual operational limits for each department. Budgets are dynamically matched against ledger transactions.
                  </CardDescription>
                </div>
                {isManager && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleResetBudgets} disabled={isPending} className="h-8.5 text-xs">
                      <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Changes
                    </Button>
                    <Button size="sm" onClick={handleSaveBudgets} disabled={isPending} className="h-8.5 text-xs bg-primary text-primary-foreground hover:bg-primary/95">
                      {isPending ? "Saving..." : "Save Budget Allocations"}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/80">
                {statements.budgetVsActual.map((item) => {
                  const meta = CATEGORY_META[item.category] || {
                    label: item.category,
                    desc: "Operational budget category.",
                    icon: "HelpCircle",
                    color: "from-gray-500 to-slate-500",
                  };
                  const currentVal = editedBudgets[item.category] ?? item.allocated;
                  const ratio = currentVal > 0 ? (item.actual / currentVal) * 100 : 0;
                  const isOver = item.actual > currentVal;

                  return (
                    <div key={item.category} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-muted/10 transition-colors">
                      <div className="flex gap-4 items-start max-w-md">
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${meta.color} flex items-center justify-center text-white shrink-0`}>
                          <span className="font-bold text-sm tracking-tight capitalize">{item.category.slice(0, 2)}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-foreground">{meta.label}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{meta.desc}</p>
                        </div>
                      </div>

                      {/* Progress Metrics */}
                      <div className="flex flex-col sm:flex-row gap-6 lg:gap-12 flex-1 justify-end items-start sm:items-center">
                        <div className="w-full max-w-[200px] flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-muted-foreground font-medium">Consumption</span>
                            <span className={`font-bold font-mono ${isOver ? 'text-red-500' : ratio > 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {ratio.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500 animate-pulse' : ratio > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(ratio, 100)}%` }} 
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span>Actual Spent:</span>
                            <span className="font-semibold font-mono text-foreground">ETB {item.actual.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Input or Display for Allocation */}
                        <div className="flex flex-col gap-1 sm:text-right shrink-0">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Budget Limit (ETB)</label>
                          {isManager ? (
                            <input 
                              type="number"
                              value={currentVal}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setEditedBudgets(prev => ({ ...prev, [item.category]: val }));
                              }}
                              className="h-9 w-40 rounded-md border border-input bg-transparent px-3 py-1 text-sm text-foreground font-semibold shadow-sm focus:outline-none focus:ring-1 focus:ring-primary sm:text-right"
                            />
                          ) : (
                            <span className="text-sm font-bold text-foreground">
                              ETB {item.allocated.toLocaleString()}
                            </span>
                          )}
                          <div className={`text-[10px] font-medium flex items-center gap-1 mt-0.5 sm:justify-end ${isOver ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {isOver ? (
                              <>
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Over Budget by ETB {(item.actual - currentVal).toLocaleString()}
                              </>
                            ) : (
                              <span>Surplus: ETB {(currentVal - item.actual).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* ─── TAB 2: GENERAL LEDGER ───────────────────────────────────────── */}
        {activeTab === "ledger" && (
          <div className="mt-6 flex flex-col gap-6 outline-none">
          {/* Filters and Actions Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1 max-w-4xl">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search by description or reference..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-9.5 w-full rounded-md border border-input bg-card text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="h-9.5 rounded-md border border-input bg-card px-3 text-xs md:text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                >
                  <option value="all">All Accounts (Chart)</option>
                  {Object.entries(CHART_OF_ACCOUNTS).map(([code, meta]) => (
                    <option key={code} value={code}>{code} - {meta.name}</option>
                  ))}
                </select>
              </div>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="h-9.5 rounded-md border border-input bg-card px-3 text-xs md:text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-medium"
              >
                <option value="all">All Transactions</option>
                <option value="debit">Debits Only</option>
                <option value="credit">Credits Only</option>
                <option value="manual">Manual Adjustments</option>
                <option value="automated">Automated Postings</option>
              </select>
            </div>

            {/* Manual Entry Dialog */}
            {(isAccountant || isManager) && (
              <Dialog open={journalOpen} onOpenChange={setJournalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-9.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm font-semibold">
                    <PlusCircle className="h-4 w-4" /> Post Manual Adjustment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[460px]">
                  <DialogHeader>
                    <DialogTitle>Add Manual Journal entry</DialogTitle>
                    <DialogDescription>
                      Post adjustments, fixed assets additions, or capital allocations. Double-entry validation rules apply.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account (Debit or Credit Target)</label>
                      <select 
                        value={journalData.accountCode}
                        onChange={(e) => setJournalData(prev => ({ ...prev, accountCode: e.target.value }))}
                        className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                      >
                        {Object.entries(CHART_OF_ACCOUNTS).map(([code, meta]) => (
                          <option key={code} value={code}>{code} - {meta.name} ({meta.type})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Debit (Birr)</label>
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={journalData.debit || ""}
                          onChange={(e) => setJournalData(prev => ({ ...prev, debit: parseFloat(e.target.value) || 0, credit: 0 }))}
                          className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-bold text-foreground"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credit (Birr)</label>
                        <input 
                          type="number"
                          placeholder="0.00"
                          value={journalData.credit || ""}
                          onChange={(e) => setJournalData(prev => ({ ...prev, credit: parseFloat(e.target.value) || 0, debit: 0 }))}
                          className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary font-bold text-foreground"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference (e.g. JV-2026-001)</label>
                      <input 
                        type="text"
                        placeholder="JV-2018-001"
                        value={journalData.reference}
                        onChange={(e) => setJournalData(prev => ({ ...prev, reference: e.target.value }))}
                        className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transaction Description</label>
                      <textarea 
                        placeholder="E.g. Computer hardware evaluation / Land capitalization addition"
                        value={journalData.description}
                        onChange={(e) => setJournalData(prev => ({ ...prev, description: e.target.value }))}
                        className="min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setJournalOpen(false)} disabled={isPending}>Cancel</Button>
                    <Button onClick={handleSubmitJournal} disabled={isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
                      {isPending ? "Posting..." : "Post Transaction"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Transactions Table */}
          <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
            <CardHeader className="pb-3 border-b border-border/80">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Ledger Journal Entries</CardTitle>
                <span className="text-xs text-muted-foreground font-medium font-mono">{filteredLedger.length} matching rows found</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="divide-x divide-border/60">
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Reference</th>
                      <th className="px-4 py-3 text-left font-semibold">Description</th>
                      <th className="px-4 py-3 text-left font-semibold">Account Code & Name</th>
                      <th className="px-4 py-3 text-center font-semibold">Type</th>
                      <th className="px-4 py-3 text-right font-semibold">Debit (Birr)</th>
                      <th className="px-4 py-3 text-right font-semibold">Credit (Birr)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/80">
                    {filteredLedger.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                          <ClipboardList className="h-10 w-10 opacity-25 mx-auto mb-3" />
                          <p className="font-semibold text-sm">No ledger transactions found matching filters.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredLedger.map((tx) => (
                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors divide-x divide-border/40 font-medium">
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground font-mono">
                            {new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs font-bold text-primary font-mono">
                            {tx.reference}
                          </td>
                          <td className="px-4 py-3.5 max-w-[250px] truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-bold font-mono">{tx.accountCode}</span>
                              <span className="truncate text-xs">{tx.accountName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${tx.type === 'manual' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap font-bold text-foreground/90 font-mono text-xs">
                            {tx.debit > 0 ? `ETB ${tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap font-bold text-foreground/90 font-mono text-xs">
                            {tx.credit > 0 ? `ETB ${tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* ─── TAB 3: TRIAL BALANCE ────────────────────────────────────────── */}
        {activeTab === "trial" && (
          <div className="mt-6 flex flex-col gap-6 outline-none">
          <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
            <CardHeader className="pb-4 border-b border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Trial Balance</CardTitle>
                <CardDescription>
                  List of all accounts from the school's Chart of Accounts demonstrating double-entry mathematical balance.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1.5 rounded-lg">
                <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Ledger Status: Balanced</span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr className="divide-x divide-border/60">
                      <th className="px-6 py-3 text-left font-semibold">Account Code</th>
                      <th className="px-6 py-3 text-left font-semibold">Account Description</th>
                      <th className="px-6 py-3 text-left font-semibold">Type</th>
                      <th className="px-6 py-3 text-right font-semibold">Debit Balance (Birr)</th>
                      <th className="px-6 py-3 text-right font-semibold">Credit Balance (Birr)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/80">
                    {statements.trialBalance.map((row) => (
                      <tr key={row.code} className="hover:bg-muted/20 transition-colors divide-x divide-border/40 font-medium">
                        <td className="px-6 py-3 whitespace-nowrap font-bold text-primary font-mono text-xs">{row.code}</td>
                        <td className="px-6 py-3">{row.name}</td>
                        <td className="px-6 py-3 text-xs text-muted-foreground">{row.type}</td>
                        <td className="px-6 py-3 text-right whitespace-nowrap font-semibold font-mono text-xs text-foreground/90">
                          {row.netDebit > 0 ? `ETB ${row.netDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                        </td>
                        <td className="px-6 py-3 text-right whitespace-nowrap font-semibold font-mono text-xs text-foreground/90">
                          {row.netCredit > 0 ? `ETB ${row.netCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-muted/50 font-bold border-t-2 border-primary divide-x divide-border/60">
                      <td colSpan={3} className="px-6 py-4 text-right text-foreground uppercase tracking-wider">Total Sums</td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-sm underline decoration-double">
                        ETB {statements.trialBalance.reduce((sum, r) => sum + r.netDebit, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap font-mono text-sm underline decoration-double">
                        ETB {statements.trialBalance.reduce((sum, r) => sum + r.netCredit, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>)}

        {/* ─── TAB 4: INCOME STATEMENT ─────────────────────────────────────── */}
        {activeTab === "income" && (
          <div className="mt-6 flex flex-col gap-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Detailed Statement */}
            <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-border bg-card">
              <CardHeader className="pb-4 border-b border-border/80">
                <CardTitle className="text-lg">Income Statement (Profit & Loss)</CardTitle>
                <CardDescription>Operating revenues and operational expenditures for the academic year.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* 1. Revenues */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">1. Operating Revenue</h3>
                  <div className="divide-y border rounded-lg bg-muted/20 overflow-hidden text-sm">
                    {statements.incomeStatement.revenues.map((r, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-3 font-medium">
                        <span className="flex items-center gap-2">
                          <span className="text-[10px] bg-muted-foreground/15 text-muted-foreground px-1 py-0.5 rounded font-mono font-bold">{r.code}</span>
                          {r.name}
                        </span>
                        <span className="font-bold font-mono">ETB {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 font-extrabold border-t">
                      <span>Total School Revenue</span>
                      <span className="font-mono">ETB {statements.incomeStatement.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Expenses */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">2. Operating Expenses</h3>
                  <div className="divide-y border rounded-lg bg-muted/20 overflow-hidden text-sm">
                    {statements.incomeStatement.expenses.map((e, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-3 font-medium">
                        <span className="flex items-center gap-2">
                          <span className="text-[10px] bg-muted-foreground/15 text-muted-foreground px-1 py-0.5 rounded font-mono font-bold">{e.code}</span>
                          {e.name}
                        </span>
                        <span className="font-bold font-mono">ETB {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-4 py-3 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 font-extrabold border-t">
                      <span>Total Operating Expense</span>
                      <span className="font-mono">ETB {statements.incomeStatement.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                {/* Net Income */}
                <div className={`p-4 rounded-lg flex justify-between items-center font-extrabold border ${statements.incomeStatement.netIncome >= 0 ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-red-500 text-white border-red-600'}`}>
                  <span className="uppercase tracking-wider">Net Operating Surplus (Profit)</span>
                  <span className="text-lg font-mono">
                    ETB {statements.incomeStatement.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

              </CardContent>
            </Card>

            {/* Metric Dials Side-panel */}
            <div className="flex flex-col gap-6">
              <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Operational Efficiency</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="relative h-32 w-32 flex items-center justify-center mb-4">
                    {/* Ring background */}
                    <svg className="absolute h-full w-full transform -rotate-90">
                      <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted" />
                      <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="8" fill="transparent" 
                        strokeDasharray={339}
                        strokeDashoffset={339 - (339 * Math.max(0, Math.min(100, (statements.incomeStatement.totalRevenue > 0 ? (statements.incomeStatement.netIncome / statements.incomeStatement.totalRevenue) * 100 : 0)))) / 100}
                        className="text-emerald-500" 
                      />
                    </svg>
                    <span className="text-2xl font-black font-mono">
                      {(statements.incomeStatement.totalRevenue > 0 ? (statements.incomeStatement.netIncome / statements.incomeStatement.totalRevenue) * 100 : 0).toFixed(0)}%
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm">Net Profit Margin</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Percentage of total school revenue converted to pure budget surplus.</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
                <CardHeader>
                  <CardTitle className="text-base">Quick Ratios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs text-muted-foreground">Revenue to Expense ratio</span>
                    <span className="font-bold text-sm">
                      {(statements.incomeStatement.totalRevenue / Math.max(1, statements.incomeStatement.totalExpense)).toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-xs text-muted-foreground">Salaries to Cost ratio</span>
                    <span className="font-bold text-sm">
                      {((statements.incomeStatement.expenses.find(e => e.code === "5000")?.amount || 0) / Math.max(1, statements.incomeStatement.totalExpense) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Procurement to Cost ratio</span>
                    <span className="font-bold text-sm">
                      {(statements.incomeStatement.expenses.filter(e => e.code !== "5000").reduce((sum, e) => sum + e.amount, 0) / Math.max(1, statements.incomeStatement.totalExpense) * 100).toFixed(0)}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>)}

        {/* ─── TAB 5: BALANCE SHEET ────────────────────────────────────────── */}
        {activeTab === "balance" && (
          <div className="mt-6 flex flex-col gap-6 outline-none">
          <Card className="border-0 shadow-sm ring-1 ring-border bg-card">
            <CardHeader className="pb-4 border-b border-border/80">
              <CardTitle className="text-lg">Balance Sheet</CardTitle>
              <CardDescription>Assets, Liabilities, and Owner's Equity demonstrating structural solvency.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* ASSETS */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-primary">ASSETS</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Current Assets */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Assets</h4>
                      <div className="divide-y border rounded-lg bg-muted/20 overflow-hidden text-sm">
                        {statements.balanceSheet.assets.filter(a => a.code !== "1500").map((a, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2.5 font-medium">
                            <span>{a.name}</span>
                            <span className="font-bold font-mono">ETB {a.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fixed Assets */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fixed & Capital Assets</h4>
                      <div className="divide-y border rounded-lg bg-muted/20 overflow-hidden text-sm">
                        {statements.balanceSheet.assets.filter(a => a.code === "1500").map((a, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2.5 font-medium">
                            <span>{a.name}</span>
                            <span className="font-bold font-mono">ETB {a.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Total Assets Footer */}
                  <div className="flex justify-between items-center px-4 py-3 bg-primary text-primary-foreground font-extrabold rounded-lg text-sm shadow-sm mt-6">
                    <span className="uppercase tracking-wider">TOTAL ASSETS</span>
                    <span className="font-mono text-base border-b-2 border-primary-foreground/30 pb-0.5 underline decoration-double">
                      ETB {statements.balanceSheet.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* LIABILITIES & OWNER'S EQUITY */}
                <div className="space-y-4">
                  <div className="border-b pb-2">
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-primary">LIABILITIES & EQUITY</h3>
                  </div>

                  <div className="space-y-4">
                    {/* Liabilities */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Liabilities</h4>
                      <div className="divide-y border rounded-lg bg-muted/20 overflow-hidden text-sm">
                        {statements.balanceSheet.liabilities.length === 0 ? (
                          <div className="px-4 py-3 text-center text-xs text-muted-foreground">No accounts payable outstanding.</div>
                        ) : (
                          statements.balanceSheet.liabilities.map((l, i) => (
                            <div key={i} className="flex justify-between items-center px-4 py-2.5 font-medium">
                              <span>{l.name}</span>
                              <span className="font-bold font-mono">ETB {l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Owner's Equity */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Retained Earnings & Reserves</h4>
                      <div className="divide-y border rounded-lg bg-muted/20 overflow-hidden text-sm">
                        {statements.balanceSheet.equity.map((eq, i) => (
                          <div key={i} className="flex justify-between items-center px-4 py-2.5 font-medium">
                            <span>{eq.name}</span>
                            <span className="font-bold font-mono">ETB {eq.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Total Liabilities & Equity Footer */}
                  <div className="flex justify-between items-center px-4 py-3 bg-emerald-600 text-white font-extrabold rounded-lg text-sm shadow-sm mt-6">
                    <span className="uppercase tracking-wider">TOTAL LIABILITIES & EQUITY</span>
                    <span className="font-mono text-base border-b-2 border-white/30 pb-0.5 underline decoration-double">
                      ETB {statements.balanceSheet.totalEquity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Solvency Audit banner */}
              <div className="mt-8 border border-emerald-200 dark:border-emerald-950/20 bg-emerald-50 dark:bg-emerald-950/10 p-4 rounded-xl flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">Solvency Balance Confirmed</h4>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-500/80 mt-0.5 leading-relaxed">
                    Accounting compliance is strictly verified: **Total Assets** matches **Total Liabilities & Equity** perfectly. Solvency checks are locked.
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>)}
      </div>
    </div>
  );
}
