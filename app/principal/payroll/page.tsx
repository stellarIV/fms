"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileDown, Search, Lock, Edit2, Save, Send } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { INITIAL_PAYROLL_DATA } from "@/lib/constants"
import { getPayrollAction, savePayrollAction } from "@/app/actions/payroll"
import { createAuditLogsAction, type AuditLogEntry } from "@/app/actions/audit-log"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ET", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const calculateIncomeTax = (taxableIncome: number) => {
  if (taxableIncome <= 2000) return 0;
  if (taxableIncome <= 4000) return (taxableIncome * 0.15) - 300;
  if (taxableIncome <= 7000) return (taxableIncome * 0.20) - 500;
  if (taxableIncome <= 10000) return (taxableIncome * 0.25) - 850;
  if (taxableIncome <= 14000) return (taxableIncome * 0.30) - 1350;
  return (taxableIncome * 0.35) - 2050;
};

export default function PrincipalPayrollPage() {
  const { data: session } = authClient.useSession()
  const [searchTerm, setSearchTerm] = useState("")
  
  // Determine section based on role
  const userSection = useMemo(() => {
    const role = (session?.user as any)?.role as string
    if (!role) return null
    if (role === "principal_kg") return "KG"
    if (role === "principal_elementary") return "Elementary"
    if (role === "principal_middle" || role === "admin" || role === "manager") return "Middle School" // Default to Middle School for admin testing
    if (role === "principal_high") return "High School"
    return null
  }, [session])

  // Initial local state empty to avoid flashing full table
  const [payrollData, setPayrollData] = useState<any[]>([])

  // Snapshot of original data from DB — used for change diffing
  const originalDataRef = useRef<any[]>([])

  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial data from DB on load
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await getPayrollAction();
      if (result.success && result.data) {
        // STRICT FILTERING: If no userSection is found, show NOTHING to prevent leakage
        if (!userSection) {
          setPayrollData([]);
          originalDataRef.current = [];
        } else {
          const filtered = (result.data as any[]).filter(row => row.section === userSection);
          setPayrollData(filtered);
          // Deep-clone snapshot so edits don't mutate it
          originalDataRef.current = JSON.parse(JSON.stringify(filtered));
        }
      }
      setIsLoading(false);
    };
    fetchData();
  }, [userSection]);

  const handleSave = async () => {
    setIsSaving(true)

    // --- Diff changes against original snapshot ---
    const principalName = session?.user?.name || "Unknown Principal"
    const principalRole = ((session?.user as any)?.role as string) || "principal"
    const auditEntries: AuditLogEntry[] = []

    const FIELD_LABELS: Record<string, string> = {
      name: "name",
      position: "position",
      accWorkingDate: "ACC/Working Date"
    }

    for (const current of payrollData) {
      const original = originalDataRef.current.find((r: any) => r.no === current.no)
      if (!original) continue

      for (const field of ["name", "position", "accWorkingDate"] as const) {
        const oldVal = String(original[field])
        const newVal = String(current[field])
        if (oldVal !== newVal) {
          auditEntries.push({
            changeDescription: `Changed ${FIELD_LABELS[field]} of ID ${current.no} in payroll table from "${oldVal}" to "${newVal}"`,
            changerName: principalName,
            changerRole: principalRole,
            employeeNo: current.no,
            fieldChanged: field,
            oldValue: oldVal,
            newValue: newVal,
          })
        }
      }
    }

    // Insert audit logs if there are changes
    if (auditEntries.length > 0) {
      const auditResult = await createAuditLogsAction(auditEntries)
      if (!auditResult.success) {
        console.error("Audit log insert failed:", auditResult.error)
        toast.error("Failed to log changes: " + auditResult.error)
      }
    }

    // Persist computed taxableIncome to DB alongside the raw data
    const dataToSave = payrollData.map(row => ({
      ...row,
      taxableIncome: row.basicSalary * (row.accWorkingDate / 30)
    }));
    const result = await savePayrollAction(dataToSave);
    setIsSaving(false)
    if (result.success) {
      // Update snapshot to current state after successful save
      originalDataRef.current = JSON.parse(JSON.stringify(payrollData))
      const changeCount = auditEntries.length
      toast.success(
        changeCount > 0
          ? `Saved successfully! ${changeCount} change${changeCount > 1 ? "s" : ""} logged.`
          : "Changes saved successfully!"
      )
    } else {
      toast.error("Failed to save changes: " + result.error)
    }
  }

  const handleSend = () => {
    setIsSending(true)
    setTimeout(() => {
      setIsSending(false)
      toast.success(`Payroll for ${userSection || "General"} section has been sent to the Finance Head!`)
    }, 1500)
  }

  const handleInputChange = (no: number, field: string, value: string | number) => {
    setPayrollData((prev) => 
      prev.map(row => row.no === no ? { ...row, [field]: value } : row)
    );
  };

  const processedData = useMemo(() => {
    return payrollData.map(row => {
      // Formula: Taxable Income = Basic Salary × (ACC/Working Date / 30)
      const taxableIncome = row.basicSalary * (row.accWorkingDate / 30);
      const payPerDay = row.basicSalary / 30;
      const incomeTax = calculateIncomeTax(taxableIncome);
      const pensionTax11 = taxableIncome * 0.11;
      const pension7 = taxableIncome * 0.07;
      const totalDeduction = incomeTax + pensionTax11 + pension7;
      const totalPensionFund = pensionTax11 + pension7;
      const netPay = taxableIncome - totalDeduction - row.receivable;

      return {
        ...row,
        taxableIncome,
        payPerDay,
        incomeTax,
        pensionTax11,
        pension7,
        totalDeduction,
        totalPensionFund,
        netPay
      };
    });
  }, [payrollData]);

  const filteredData = processedData.filter((row) =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExportCSV = () => {
    const headers = [
      "No", "Name", "Position", "Section", "Basic Salary", "For Pension Contribution Deduction Purpose",
      "Pay per Day", "ACC/Working Date", "Allowance for Service Assistance", "Allowance for Overtime",
      "Pension Tax 11%", "Taxable Income", "Gross Salary", "Income Tax", "Pension 7%", 
      "Total Deduction", "Receivable", "Total Pension Fund (7% & 11%)", "Net Pay"
    ];

    const csvData = filteredData.map(row => [
      row.no, row.name, row.position, row.section, row.basicSalary, row.forPensionContributionDeductionPurpose,
      row.payPerDay, row.accWorkingDate, row.allowanceForServiceAssistance, row.allowanceForOvertime,
      row.pensionTax11, row.taxableIncome, row.grossSalary, row.incomeTax, row.pension7,
      row.totalDeduction, row.receivable, row.totalPensionFund, row.netPay
    ]);

    const csvContent = [headers.join(","), ...csvData.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `payroll_${userSection || "section"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll Management: {userSection || "Principal View"}</h2>
          <p className="text-muted-foreground mt-1 flex items-center space-x-4">
            <span className="flex items-center"><Lock className="w-3 h-3 mr-1.5" /> Locked Fields</span>
            <span className="flex items-center text-primary"><Edit2 className="w-3 h-3 mr-1.5" /> Editable by Principal</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExportCSV} variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card className="shadow-md overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div>
              <CardTitle>{userSection} Section Employees</CardTitle>
              <CardDescription>
                You can edit Name, Position, and Working Days. All other financial fields are managed by Accounting.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="w-full pl-9 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-max border-collapse">
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-center border-r">No</TableHead>
                  <TableHead className="font-semibold min-w-[200px] border-r bg-primary/5 text-primary">
                    <span className="flex items-center justify-start"><Edit2 className="w-3 h-3 mr-1" /> Name</span>
                  </TableHead>
                  <TableHead className="font-semibold border-r bg-primary/5 text-primary">
                    <span className="flex items-center justify-start"><Edit2 className="w-3 h-3 mr-1" /> Position</span>
                  </TableHead>
                  <TableHead className="font-semibold border-r">Section</TableHead>
                  <TableHead className="font-semibold text-right border-r">Basic Salary</TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-muted/30">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> For Pension Contrib.<br/>Deduction Purpose</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-muted/30">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Pay per<br/>Day</span>
                  </TableHead>
                  <TableHead className="font-semibold text-center border-r whitespace-nowrap bg-primary/5 text-primary">
                    <span className="flex items-center justify-center"><Edit2 className="w-3 h-3 mr-1" /> ACC/Working<br/>Date</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-muted/30">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Allowance for<br/>Service Assistance</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-muted/30">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Allowance for<br/>Overtime</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-muted/30">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Pension Tax<br/>11%</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r bg-blue-50/50 dark:bg-blue-900/10 whitespace-nowrap">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Taxable<br/>Income</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r bg-blue-50/50 dark:bg-blue-900/10">Gross<br/>Salary</TableHead>
                  <TableHead className="font-semibold text-right border-r text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Income<br/>Tax</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r text-red-600 dark:text-red-400 bg-red-50/30 dark:bg-red-900/10">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Pension<br/>7%</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r text-red-600 dark:text-red-400 font-bold bg-red-50/30 dark:bg-red-900/10">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Total<br/>Deduction</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-muted/30">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Receivable</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r bg-purple-50/50 dark:bg-purple-900/10 whitespace-nowrap">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Total Pension<br/>Fund (7% & 11%)</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right bg-green-50/50 dark:bg-green-900/10 text-green-700 dark:text-green-400 font-bold">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Net Pay</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(isLoading || !session) ? (
                  <TableRow>
                    <TableCell colSpan={19} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-muted-foreground animate-pulse text-lg font-medium">Synchronizing with Database...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, index) => (
                    <TableRow 
                      key={row.no}
                      className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                    >
                      <TableCell className="text-center font-medium border-r">{row.no}</TableCell>
                      
                      {/* Editable: Name (Principal Only) */}
                      <TableCell className="font-medium border-r p-1 bg-primary/5">
                        <Input 
                          className="h-8 w-full bg-transparent border-transparent hover:border-input focus:bg-background transition-colors"
                          value={row.name}
                          onChange={(e) => handleInputChange(row.no, "name", e.target.value)}
                        />
                      </TableCell>
                      
                      {/* Editable: Position (Principal Only) */}
                      <TableCell className="text-muted-foreground text-sm border-r p-1 bg-primary/5">
                        <Input 
                          className="h-8 w-full bg-transparent border-transparent hover:border-input focus:bg-background transition-colors"
                          value={row.position}
                          onChange={(e) => handleInputChange(row.no, "position", e.target.value)}
                        />
                      </TableCell>

                      <TableCell className="border-r">
                        <Badge variant="outline" className={cn(
                          "font-normal",
                          row.section === "KG" && "bg-pink-100 text-pink-700 border-pink-200",
                          row.section === "Elementary" && "bg-blue-100 text-blue-700 border-blue-200",
                          row.section === "Middle School" && "bg-orange-100 text-orange-700 border-orange-200",
                          row.section === "High School" && "bg-purple-100 text-purple-700 border-purple-200",
                          row.section === "All" && "bg-slate-100 text-slate-700 border-slate-200"
                        )}>
                          {row.section}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right border-r text-muted-foreground">{formatCurrency(row.basicSalary)}</TableCell>
                      
                      {/* Read-Only: For Pension Contribution Deduction Purpose */}
                      <TableCell className="text-right border-r bg-muted/10">{formatCurrency(row.forPensionContributionDeductionPurpose)}</TableCell>

                      <TableCell className="text-right border-r bg-muted/10 font-medium">{formatCurrency(row.payPerDay)}</TableCell>
                      
                      {/* Editable: ACC/Working Date */}
                      <TableCell className="text-center border-r p-1 bg-primary/5">
                        <Input 
                          type="number"
                          className="h-8 min-w-[80px] text-center bg-transparent border-transparent hover:border-input focus:bg-background transition-colors"
                          value={row.accWorkingDate || ""}
                          onChange={(e) => handleInputChange(row.no, "accWorkingDate", e.target.value === "" ? 0 : parseFloat(e.target.value))}
                        />
                      </TableCell>

                      {/* Read-Only: Allowances */}
                      <TableCell className="text-right border-r bg-muted/10">{formatCurrency(row.allowanceForServiceAssistance)}</TableCell>
                      <TableCell className="text-right border-r bg-muted/10">{formatCurrency(row.allowanceForOvertime)}</TableCell>

                      <TableCell className="text-right border-r bg-muted/10 font-medium">{formatCurrency(row.pensionTax11)}</TableCell>
                      <TableCell className="text-right border-r bg-blue-50/30 dark:bg-blue-900/5 text-muted-foreground">{formatCurrency(row.taxableIncome)}</TableCell>
                      <TableCell className="text-right font-medium border-r bg-blue-50/30 dark:bg-blue-900/5 text-muted-foreground">{formatCurrency(row.grossSalary)}</TableCell>
                      <TableCell className="text-right border-r text-red-600/80 dark:text-red-400/80 bg-red-50/20 dark:bg-red-900/10 font-medium">{formatCurrency(row.incomeTax)}</TableCell>
                      <TableCell className="text-right border-r text-red-600/80 dark:text-red-400/80 bg-red-50/20 dark:bg-red-900/10 font-medium">{formatCurrency(row.pension7)}</TableCell>
                      <TableCell className="text-right font-bold border-r text-red-600/90 dark:text-red-400/90 bg-red-50/30 dark:bg-red-900/20">{formatCurrency(row.totalDeduction)}</TableCell>
                      
                      {/* Read-Only: Receivable */}
                      <TableCell className="text-right border-r bg-muted/10">{formatCurrency(row.receivable)}</TableCell>

                      <TableCell className="text-right border-r bg-purple-50/30 dark:bg-purple-900/10 font-medium">{formatCurrency(row.totalPensionFund)}</TableCell>
                      <TableCell className="text-right font-bold bg-green-50/50 dark:bg-green-900/20 text-green-700 dark:text-green-400">{formatCurrency(row.netPay)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={19} className="h-24 text-center">
                      No employees found matching the search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row justify-end items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4 pb-12">
        <Button 
          variant="outline" 
          className="w-full sm:w-40 border-primary text-primary hover:bg-primary/5" 
          onClick={handleSave} 
          disabled={isSaving || isSending}
        >
          {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  )
}
