"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Printer, MoreHorizontal, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const DEMO_INVOICES = [
  {
    id: "INV-2024-001",
    student: "Abebe Bikila",
    rollNo: "R-101",
    amount: 2675,
    dueDate: "2024-05-15",
    status: "Paid",
    period: "Meskerem 2017",
  },
  {
    id: "INV-2024-002",
    student: "Sara Mohammed",
    rollNo: "R-102",
    amount: 1500,
    dueDate: "2024-05-15",
    status: "Pending",
    period: "Meskerem 2017",
  },
  {
    id: "INV-2024-003",
    student: "Kebede Yosef",
    rollNo: "R-103",
    amount: 2300,
    dueDate: "2024-04-15",
    status: "Overdue",
    period: "Tikimt 2017",
  },
  {
    id: "INV-2024-004",
    student: "Martha Tadesse",
    rollNo: "R-104",
    amount: 1800,
    dueDate: "2024-05-20",
    status: "Pending",
    period: "Meskerem 2017",
  },
  {
    id: "INV-2024-005",
    student: "Dawit Lema",
    rollNo: "R-105",
    amount: 3200,
    dueDate: "2024-05-10",
    status: "Paid",
    period: "Hidar 2017",
  },
];

export function InvoicesClient() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = DEMO_INVOICES.filter(
    (inv) =>
      inv.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.rollNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices by student, ID or roll no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2">
            <Printer className="h-4 w-4" />
            Print Batch
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Invoice ID</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Billing Period</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInvoices.map((inv) => (
              <TableRow key={inv.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-xs font-bold">{inv.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">{inv.student}</span>
                    <span className="text-xs text-muted-foreground">{inv.rollNo}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-normal">
                    {inv.period}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{inv.dueDate}</TableCell>
                <TableCell className="text-right font-bold font-mono">
                  {inv.amount.toLocaleString()} ETB
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    className={
                      inv.status === "Paid"
                        ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                        : inv.status === "Overdue"
                        ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-100"
                        : "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100"
                    }
                  >
                    {inv.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem className="gap-2">
                        <Eye className="h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2">
                        <Printer className="h-4 w-4" /> Print Invoice
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">Cancel Invoice</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
