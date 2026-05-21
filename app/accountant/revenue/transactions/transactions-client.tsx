"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Download, Filter } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

type StudentType = {
  rollNo: string;
  name: string;
  paymentCode: string;
};

type TransactionType = {
  id: string;
  month: number;
  year: number;
  totalMonthlyFee: number;
  totalPayment: number;
  receiptNumber: string | null;
  updatedAt: string | Date | null;
  student: StudentType;
};

const MONTHS: Record<number, string> = {
  1: "Meskerem",
  2: "Tikimt",
  3: "Hidar",
  4: "Tahsas",
  5: "Tir",
  6: "Yekatit",
  7: "Megabit",
  8: "Meyazia",
  9: "Ginbot",
  10: "Sene",
};

export function TransactionsClient({ initialTransactions }: { initialTransactions: TransactionType[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = initialTransactions.filter((t) => {
    const search = searchQuery.toLowerCase();
    return (
      t.student.name.toLowerCase().includes(search) ||
      t.student.rollNo.toLowerCase().includes(search) ||
      (t.receiptNumber?.toLowerCase().includes(search) ?? false)
    );
  });

  const handleExport = () => {
    const headers = ["Date", "Student", "Roll No", "Month", "Year", "Receipt #", "Amount (ETB)"];
    const rows = filteredTransactions.map((t) => [
      t.updatedAt ? format(new Date(t.updatedAt), "yyyy-MM-dd") : "-",
      t.student.name,
      t.student.rollNo,
      MONTHS[t.month] || t.month,
      t.year,
      t.receiptNumber || "-",
      t.totalPayment.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student, roll no, or receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Date & Time</TableHead>
              <TableHead>Student Details</TableHead>
              <TableHead>Billing Month</TableHead>
              <TableHead>Receipt Number</TableHead>
              <TableHead className="text-right">Amount Paid</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 opacity-20" />
                    <p>No transactions found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((t) => {
                const isFullPayment = t.totalPayment >= t.totalMonthlyFee;
                return (
                  <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {t.updatedAt ? format(new Date(t.updatedAt), "MMM d, yyyy") : "N/A"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {t.updatedAt ? format(new Date(t.updatedAt), "h:mm a") : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{t.student.name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{t.student.rollNo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {MONTHS[t.month]} {t.year}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs px-1.5 py-0.5 bg-muted rounded font-mono">
                        {t.receiptNumber || "N/A"}
                      </code>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {t.totalPayment.toLocaleString()} ETB
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={isFullPayment ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"}
                      >
                        {isFullPayment ? "Full Payment" : "Partial Payment"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground">
          Showing {filteredTransactions.length} of {initialTransactions.length} transactions
        </p>
      </div>
    </div>
  );
}
