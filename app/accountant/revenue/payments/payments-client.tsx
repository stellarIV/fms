"use client";

import { useState, useEffect, useTransition, Fragment } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updatePayment, updatePaymentsBatch, updateMonthlyPaymentStatus } from "@/app/actions/payments";
import { saveDailyReport } from "@/app/actions/reports";
import { updateStudentNameAction } from "@/app/actions/students";
import { CheckCircle2, Save, Loader2, Search, Lock, XCircle, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

type StudentType = {
  rollNo: string;
  name: string;
  paymentCode: string;
};

type PaymentType = {
  id: string;
  month: number;
  year: number;
  prevPending: number;
  registrationFee: number;
  tuitionFee: number;
  transportFee: number;
  penaltyFee: number;
  totalMonthlyFee: number;
  totalPayment: number;
  pendingFee: number;
  receiptNumber: string | null;
  bankDate: Date | null;
  updatedAt: Date | null;
  student: StudentType;
};
import { getGradeFromPaymentCode } from "@/lib/utils";

type MonthlyStatusType = { id: string; month: number; year: number; status: string; rejectionReason: string | null } | null;

export function PaymentsClient({
  initialPayments,
  principalMode = false,
  readOnlyMode = false,
  financeHeadMode = false,
  monthlyStatus = null,
}: {
  initialPayments: PaymentType[];
  principalMode?: boolean;
  readOnlyMode?: boolean;
  financeHeadMode?: boolean;
  monthlyStatus?: MonthlyStatusType;
}) {
  const isApproved = monthlyStatus?.status === "Approved";
  const effectiveReadOnly = readOnlyMode || isApproved;

  const [payments, setPayments] = useState<PaymentType[]>(initialPayments);
  // Track in-progress name edits: studentId -> current input value
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});
  const [savingNameId, setSavingNameId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [savedId, setSavedId] = useState<string | null>(null);

  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const currentMonthStr = searchParams.get("month") || "1";

  const months = [
    { value: "1", label: "Meskerem" },
    { value: "2", label: "Tikimt" },
    { value: "3", label: "Hidar" },
    { value: "4", label: "Tahsas" },
    { value: "5", label: "Tir" },
    { value: "6", label: "Yekatit" },
    { value: "7", label: "Megabit" },
    { value: "8", label: "Meyazia" },
    { value: "9", label: "Ginbot" },
    { value: "10", label: "Sene" },
  ];

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", e.target.value);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Filtered payments for display
  const filteredPayments = payments.filter(p => {
    const search = searchQuery.toLowerCase();
    return (
      p.student.name.toLowerCase().includes(search) ||
      p.student.paymentCode.toLowerCase().includes(search) ||
      p.student.rollNo.toLowerCase().includes(search)
    );
  });

  // Group filteredPayments by grade
  const groupedPayments = filteredPayments.reduce((acc, p) => {
    const grade = getGradeFromPaymentCode(p.student.paymentCode);
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(p);
    return acc;
  }, {} as Record<string, typeof filteredPayments>);

  const gradeOrder = ["KG 1", "KG 2", "KG 3", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Other"];
  const sortedGrades = Object.keys(groupedPayments).sort((a, b) => {
    let indexA = gradeOrder.indexOf(a);
    let indexB = gradeOrder.indexOf(b);
    if (indexA === -1) indexA = 999;
    if (indexB === -1) indexB = 999;
    return indexA - indexB;
  });

  // Deep comparison to find truly modified records
  const getModifiedPayments = () => {
    return payments.filter(current => {
      const initial = initialPayments.find(p => p.id === current.id);
      if (!initial) return false;
      
      // Normalize null/undefined to standard comparison values
      const initialPayment = initial.totalPayment || 0;
      const currentPayment = current.totalPayment || 0;
      const initialPenalty = initial.penaltyFee || 0;
      const currentPenalty = current.penaltyFee || 0;
      const initialReceipt = initial.receiptNumber || "";
      const currentReceipt = current.receiptNumber || "";
      
      return (
        currentPayment !== initialPayment ||
        currentPenalty !== initialPenalty ||
        currentReceipt !== initialReceipt
      );
    });
  };

  const modifiedPayments = getModifiedPayments();
  const modifiedIds = new Set(modifiedPayments.map(p => p.id));

  useEffect(() => {
    setPayments(initialPayments);
  }, [initialPayments]);

  const handleChange = (id: string, field: string, value: string | number) => {
    setPayments(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [field]: value };
      }
      return p;
    }));
  };

  const handleTotalPaymentBlur = (id: string, value: number) => {
    setPayments(prev => prev.map(p => {
      if (p.id === id) {
        // Auto-calculate penalty/balance: Total Payment - Total Monthly Fee, but 0 if value is 0
        const balance = value === 0 ? 0 : value - p.totalMonthlyFee;
        return { ...p, totalPayment: value, penaltyFee: balance };
      }
      return p;
    }));
  };

  const handleSave = async () => {
    if (modifiedPayments.length === 0) return;

    startTransition(async () => {
      const batchData = modifiedPayments.map(p => ({
        id: p.id,
        data: {
          totalPayment: p.totalPayment,
          penaltyFee: p.penaltyFee,
          receiptNumber: p.receiptNumber,
        }
      }));

      const result = await updatePaymentsBatch(batchData);

      if (result.success) {
        setSavedId("all");
        toast.success(`Successfully saved ${modifiedPayments.length} changes in one batch`);
        setTimeout(() => setSavedId(null), 3000);
      } else {
        const errorMsg = result.error || "Check your internet connection";
        toast.error(`Failed to save: ${errorMsg}`);
      }
    });
  };

  const generateReport = async () => {
    // Filter for payments modified today in this session or already saved today
    const today = new Date().toISOString().split('T')[0];
    const todaysWork = payments.filter(p => {
      // Check if it's in modifiedIds (about to be saved) or has an updatedAt from today
      const isModified = modifiedIds.has(p.id);
      const isSavedToday = p.updatedAt && new Date(p.updatedAt).toISOString().split('T')[0] === today;
      return isModified || isSavedToday;
    });

    if (todaysWork.length === 0) {
      toast.info("No transactions recorded for today yet.");
      return;
    }

    // Validation: Ensure all today's transactions with actual payments have receipt numbers
    const missingReceipts = todaysWork.filter(p => {
      const hasPayment = (p.totalPayment || 0) > 0;
      return hasPayment && (!p.receiptNumber || p.receiptNumber.trim() === "");
    });
    
    if (missingReceipts.length > 0) {
      toast.error(`Cannot generate report: ${missingReceipts.length} transactions are missing receipt numbers.`, {
        description: "Missing receipt rows are highlighted in yellow.",
        duration: 5000,
      });
      return;
    }

    // Prepare CSV data according to requested format
    const headers = ["eNumber", "Item Description", "CategoryName", "BuyerName", "Grand Total"];
    
    const monthName = months.find(m => m.value === currentMonthStr)?.label || "Month";
    const yearName = searchParams.get("year") || "2017";

    let totalTuition = 0;
    let totalTransport = 0;
    let totalRegistration = 0;
    let totalPenalty = 0;
    let totalOverall = 0;

    const csvRows: string[][] = [];

    todaysWork.forEach(p => {
      let remainingPayment = p.totalPayment || 0;
      if (remainingPayment <= 0) return; // Skip if 0 payment

      totalOverall += remainingPayment;
      const grade = getGradeFromPaymentCode(p.student.paymentCode);
      const eNumber = p.receiptNumber || "";
      const buyerName = p.student.name;

      if (remainingPayment > 0 && p.registrationFee > 0) {
        const amount = Math.min(remainingPayment, p.registrationFee);
        csvRows.push([eNumber, "Registration Fee", "Registration", buyerName, amount.toFixed(2)]);
        totalRegistration += amount;
        remainingPayment -= amount;
      }

      if (remainingPayment > 0 && p.transportFee > 0) {
        const amount = Math.min(remainingPayment, p.transportFee);
        csvRows.push([eNumber, `${monthName} Serv. ${p.transportFee}`, `Service Fee ${yearName}`, buyerName, amount.toFixed(2)]);
        totalTransport += amount;
        remainingPayment -= amount;
      }

      if (remainingPayment > 0 && p.tuitionFee > 0) {
        const amount = Math.min(remainingPayment, p.tuitionFee);
        csvRows.push([eNumber, `${grade} ${monthName}`, grade, buyerName, amount.toFixed(2)]);
        totalTuition += amount;
        remainingPayment -= amount;
      }

      if (remainingPayment > 0) {
        csvRows.push([eNumber, `Penalty/Other ${monthName}`, "Penalty", buyerName, remainingPayment.toFixed(2)]);
        totalPenalty += remainingPayment;
      }
    });

    const totalRows = [
      ["", "", "", "", ""],
      ["", "TOTALS", "", "", ""],
      ["", "Total Tuition Revenue", "", "", totalTuition.toFixed(2)],
      ["", "Total Service/Transport Revenue", "", "", totalTransport.toFixed(2)],
      ["", "Total Registration Revenue", "", "", totalRegistration.toFixed(2)],
      ["", "Total Penalty/Other Revenue", "", "", totalPenalty.toFixed(2)],
      ["", "GRAND TOTAL REVENUE", "", "", totalOverall.toFixed(2)]
    ];

    const csvContent = [
      headers.map(h => `"${h}"`).join(","),
      ...csvRows.map(r => r.map(c => `"${c}"`).join(",")),
      ...totalRows.map(r => r.map(c => `"${c}"`).join(","))
    ].join("\n");

    // Save to database
    await saveDailyReport(csvContent);

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `daily_report_${today}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Daily report generated successfully.");
  };

  // Check for missing receipts in active/today's work
  const todayStr = new Date().toISOString().split('T')[0];
  const missingReceiptsCount = payments.filter(p => {
    const isToday = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] === todayStr : false;
    const isModified = modifiedIds.has(p.id);
    const hasPayment = (p.totalPayment || 0) > 0;
    return (isToday || isModified) && hasPayment && (!p.receiptNumber || p.receiptNumber.trim() === "");
  }).length;

  const handleApprove = async () => {
    startTransition(async () => {
      const year = parseInt(searchParams.get("year") || "2017");
      const res = await updateMonthlyPaymentStatus(parseInt(currentMonthStr), year, "Approved");
      if (res.success) toast.success("Payments table approved!");
      else toast.error("Failed to approve: " + res.error);
    });
  };

  const handleReject = async () => {
    if (!rejectionReasonInput.trim()) {
      toast.error("Please provide a reason.");
      return;
    }
    startTransition(async () => {
      const year = parseInt(searchParams.get("year") || "2017");
      const res = await updateMonthlyPaymentStatus(parseInt(currentMonthStr), year, "Rejected", rejectionReasonInput);
      if (res.success) {
        toast.success("Payments table rejected!");
        setIsRejectDialogOpen(false);
      } else toast.error("Failed to reject: " + res.error);
    });
  };

  return (
    <div className="flex flex-col gap-2 h-[calc(100vh-10rem)] w-full overflow-hidden">
      <div className="flex justify-between items-center bg-muted/20 p-2 rounded-md border shrink-0">
        <div className="flex flex-col min-w-0">
           <h2 className="text-sm font-semibold truncate leading-tight">Active Session</h2>
           <div className="flex items-center gap-2">
             <p className="text-[10px] text-muted-foreground truncate leading-tight">{modifiedIds.size} pending changes</p>
             {missingReceiptsCount > 0 && (
               <div className="bg-yellow-500 text-yellow-950 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 animate-pulse shadow-sm border border-yellow-600">
                 <span className="h-1.5 w-1.5 bg-yellow-950 rounded-full" />
                 {missingReceiptsCount} Missing Receipts
               </div>
             )}
           </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-sm px-4">
          <div className="relative w-full">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input 
              placeholder="Search by Name, Code or Roll No..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-xs bg-background"
            />
          </div>
        </div>

        <div className="flex items-center mr-2">
          <select
            value={currentMonthStr}
            onChange={handleMonthChange}
            className="h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {(!principalMode && !effectiveReadOnly) && (
          <div className="flex gap-2 shrink-0">
            <Button 
              onClick={handleSave} 
              disabled={modifiedIds.size === 0 || isPending}
              size="sm"
              className="h-8 gap-1.5 shadow-md transition-all active:scale-95 text-xs px-3"
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {modifiedIds.size > 0 ? `Save (${modifiedIds.size})` : "Save Changes"}
            </Button>
          </div>
        )}
      </div>

      {monthlyStatus?.status === "Approved" && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-3 rounded-md flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Payments table for this month has been Approved.</span>
          </div>
        </div>
      )}

      {monthlyStatus?.status === "Rejected" && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 p-3 rounded-md flex flex-col sm:flex-row sm:items-center justify-between shadow-sm shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">Payments table for this month was Rejected.</span>
          </div>
          {monthlyStatus.rejectionReason && (
            <div className="text-xs bg-red-500/10 px-2 py-1 rounded border border-red-500/20 max-w-xl">
              <strong>Reason:</strong> {monthlyStatus.rejectionReason}
            </div>
          )}
        </div>
      )}

      {financeHeadMode && (!monthlyStatus || monthlyStatus.status !== "Approved") && (
        <div className="bg-muted/30 border border-muted-foreground/20 p-3 rounded-md flex items-center justify-between shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">Review the payments table and approve or reject it.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsRejectDialogOpen(true)} className="border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/50 dark:hover:bg-red-950">
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </Button>
            <Button size="sm" onClick={handleApprove} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle className="h-3 w-3 mr-1" />
              Approve
            </Button>
          </div>
        </div>
      )}

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reject Payments Table</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting the payments table. This will be visible to the accountant.
            </p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <textarea
              className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="E.g., Incorrect total amount for Grade 10..."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Submit Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="relative rounded-md border bg-card text-card-foreground shadow-sm flex flex-col min-h-0 overflow-hidden flex-1 w-full">
        <div className="overflow-auto scrollbar-thin flex-1 w-full">
          <Table className="min-w-[1200px] border-separate border-spacing-0 relative w-full text-xs">
            <TableHeader className="z-20">
              <TableRow className="bg-muted hover:bg-muted">
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Roll No</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Name</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Payment Code</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Registration</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Tuition Fee</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Transport Fee</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Total Monthly Fee</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Total Payment</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Penalty Fee / Balance</TableHead>
                <TableHead className="h-8 whitespace-nowrap bg-muted border-b font-bold z-30 sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.1)] py-1">Receipt Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4 text-muted-foreground">
                    {searchQuery ? `No results found for "${searchQuery}"` : "No payment records found."}
                  </TableCell>
                </TableRow>
              ) : (
                sortedGrades.map((grade) => {
                  const gradePayments = groupedPayments[grade];
                  const gradeRevenue = gradePayments.reduce((sum, p) => sum + (p.totalPayment || 0), 0);
                  const gradeExpected = gradePayments.reduce((sum, p) => sum + (p.totalMonthlyFee || 0), 0);

                  return (
                    <Fragment key={grade}>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableCell colSpan={10} className="py-2 font-semibold text-primary bg-primary/5">
                          <div className="flex justify-between items-center px-2">
                            <span>{grade} ({gradePayments.length} students)</span>
                            <span className="text-xs font-bold">Revenue: {gradeRevenue.toLocaleString()} ETB / Expected: {gradeExpected.toLocaleString()} ETB</span>
                          </div>
                        </TableCell>
                      </TableRow>
                      {gradePayments.map((payment) => {
                        const isPaymentToday = payment.updatedAt ? new Date(payment.updatedAt).toISOString().split('T')[0] === todayStr : false;
                        const isModifiedToday = modifiedIds.has(payment.id);
                        const hasActualPayment = (payment.totalPayment || 0) > 0;
                        const isMissingReceipt = (isPaymentToday || isModifiedToday) && hasActualPayment && (!payment.receiptNumber || payment.receiptNumber.trim() === "");

                        return (
                          <TableRow 
                            key={payment.id}
                      className={`h-9 transition-colors ${
                        isMissingReceipt 
                          ? "bg-yellow-100/60 dark:bg-yellow-900/30" 
                          : modifiedIds.has(payment.id) 
                            ? "bg-amber-50/50 dark:bg-amber-950/20" 
                            : savedId === "all" 
                              ? "bg-green-50 dark:bg-green-950" 
                              : ""
                      }`}
                    >
                      <TableCell className="py-1 font-mono text-[10px]">{payment.student.rollNo}</TableCell>
                      <TableCell className="py-1">
                        {principalMode && !effectiveReadOnly ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="text"
                              value={editedNames[payment.student.rollNo] ?? payment.student.name}
                              onChange={(e) =>
                                setEditedNames(prev => ({ ...prev, [payment.student.rollNo]: e.target.value }))
                              }
                              onBlur={async (e) => {
                                const newName = e.target.value.trim();
                                if (!newName || newName === payment.student.name) {
                                  // Revert if unchanged or empty
                                  setEditedNames(prev => { const n = { ...prev }; delete n[payment.student.rollNo]; return n; });
                                  return;
                                }
                                setSavingNameId(payment.student.rollNo);
                                // We need the studentId — it's stored on the payment
                                const result = await updateStudentNameAction((payment as any).studentId, newName);
                                setSavingNameId(null);
                                if (result.success) {
                                  setPayments(prev => prev.map(p =>
                                    p.id === payment.id ? { ...p, student: { ...p.student, name: newName } } : p
                                  ));
                                  setEditedNames(prev => { const n = { ...prev }; delete n[payment.student.rollNo]; return n; });
                                  toast.success(`Name updated to "${newName}"`);
                                } else {
                                  toast.error("Failed to update name: " + result.error);
                                  setEditedNames(prev => { const n = { ...prev }; delete n[payment.student.rollNo]; return n; });
                                }
                              }}
                              className="h-7 w-36 text-xs px-2 font-medium"
                              placeholder="Student name"
                            />
                            {savingNameId === payment.student.rollNo && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                            )}
                          </div>
                        ) : (
                          <span className="font-medium">{payment.student.name}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-1">{payment.student.paymentCode}</TableCell>
                      <TableCell className="py-1">{payment.registrationFee.toLocaleString()} ETB</TableCell>
                      <TableCell className="py-1">{payment.tuitionFee.toLocaleString()} ETB</TableCell>
                      <TableCell className="py-1">{payment.transportFee.toLocaleString()} ETB</TableCell>
                      <TableCell className="py-1 font-bold">{payment.totalMonthlyFee.toLocaleString()} ETB</TableCell>
                      {/* Total Payment */}
                      <TableCell className="py-1">
                        {(principalMode || effectiveReadOnly) ? (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Lock className="h-3 w-3 shrink-0" />
                            {(payment.totalPayment || 0).toLocaleString()}
                          </span>
                        ) : (
                          <Input 
                            type="number" 
                            value={payment.totalPayment || ""} 
                            onChange={(e) => handleChange(payment.id, "totalPayment", parseInt(e.target.value) || 0)}
                            onBlur={(e) => handleTotalPaymentBlur(payment.id, parseInt(e.target.value) || 0)}
                            className={`h-7 w-20 bg-background text-xs px-2 ${modifiedIds.has(payment.id) ? "border-amber-500" : ""}`}
                            placeholder="0"
                          />
                        )}
                      </TableCell>
                      {/* Penalty Fee */}
                      <TableCell className="py-1">
                        {(principalMode || effectiveReadOnly) ? (
                          <span className={`flex items-center gap-1 ${(payment.penaltyFee || 0) < 0 ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                            <Lock className="h-3 w-3 shrink-0" />
                            {(payment.penaltyFee || 0).toLocaleString()}
                          </span>
                        ) : (
                          <Input 
                            type="number" 
                            value={payment.penaltyFee === 0 ? "" : payment.penaltyFee} 
                            onChange={(e) => handleChange(payment.id, "penaltyFee", parseInt(e.target.value) || 0)}
                            className={`h-7 w-20 bg-background text-xs px-2 ${payment.penaltyFee < 0 ? "text-red-500 font-medium" : ""}`}
                            placeholder="0"
                          />
                        )}
                      </TableCell>
                      {/* Receipt Number */}
                      <TableCell className="py-1 relative">
                        {(() => {
                          const isPaidViaChapa = payment.receiptNumber?.startsWith("FMS") && !payment.receiptNumber?.startsWith("PENDING:");
                          if (isPaidViaChapa) {
                            return (
                              <span className="flex items-center gap-1 text-green-600 font-medium text-[10px]">
                                <Zap className="h-3 w-3 shrink-0" />
                                Chapa
                                <span className="text-muted-foreground font-normal">{payment.receiptNumber?.slice(0, 12)}…</span>
                              </span>
                            );
                          }
                          if (principalMode || effectiveReadOnly) {
                            return (
                              <span className="text-muted-foreground flex items-center gap-1">
                                <Lock className="h-3 w-3 shrink-0" />
                                {payment.receiptNumber || "—"}
                              </span>
                            );
                          }
                          return (
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="text"
                                value={payment.receiptNumber || ""}
                                onChange={(e) => handleChange(payment.id, "receiptNumber", e.target.value)}
                                className={`h-7 w-24 bg-background text-xs px-2 ${isMissingReceipt ? "border-yellow-600 ring-1 ring-yellow-600" : ""}`}
                                placeholder="Receipt #"
                              />
                              {savedId === "all" && <CheckCircle2 className="h-3 w-3 text-green-500" />}
                            </div>
                          );
                        })()}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </Fragment>
              );
            })
          )}
          </TableBody>
          </Table>
        </div>
      </div>
      
      {(!principalMode && !effectiveReadOnly) && (
        <div className="flex justify-center py-1.5 shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={generateReport}
            className="h-8 border-primary text-primary hover:bg-primary hover:text-primary-foreground gap-1.5 font-bold px-6 shadow-sm text-xs"
          >
            Generate Report (CSV)
          </Button>
        </div>
      )}
    </div>
  );
}
