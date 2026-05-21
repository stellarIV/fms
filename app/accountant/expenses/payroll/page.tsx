"use client"

import React, { useState, useMemo } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FileDown, Search, Lock, Edit2, Save, Send, Plus } from "lucide-react"
import { toast } from "sonner"

// Define the base data. 
import { INITIAL_PAYROLL_DATA } from "@/lib/constants"
import { savePayrollAction, getPayrollAction } from "@/app/actions/payroll"

// Note: As requested, fields like No, name, position, basic salary, gross salary, taxable salary 
// are uneditable by the accountant. The remaining fields will be editable.
const initialPayrollData = INITIAL_PAYROLL_DATA;

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ET", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Best Practice: Progressive Tax Calculation using standard implicit deductions
// Matches the provided brackets: 0-2k(0%), 2k-4k(15%), 4k-7k(20%), 7k-10k(25%), 10k-14k(30%), >14k(35%)
// Deductions ensure that earning 1 ETB over a bracket doesn't result in less net pay.
const calculateIncomeTax = (taxableIncome: number) => {
  if (taxableIncome <= 2000) return 0;
  if (taxableIncome <= 4000) return (taxableIncome * 0.15) - 300;
  if (taxableIncome <= 7000) return (taxableIncome * 0.20) - 500;
  if (taxableIncome <= 10000) return (taxableIncome * 0.25) - 850;
  if (taxableIncome <= 14000) return (taxableIncome * 0.30) - 1350;
  return (taxableIncome * 0.35) - 2050;
};

export default function PayrollPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [payrollData, setPayrollData] = useState(initialPayrollData)
  
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch initial data from DB on load
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await getPayrollAction();
      if (result.success && result.data && result.data.length > 0) {
        setPayrollData(result.data as any[]);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newEmployee, setNewEmployee] = useState({
    name: "",
    position: "",
    section: "All",
    basicSalary: 0,
  })

  const handleSaveAndRequest = async () => {
    setIsSaving(true)
    // Persist computed taxableIncome to DB alongside the raw data
    const dataToSave = payrollData.map(row => ({
      ...row,
      taxableIncome: row.basicSalary * (row.accWorkingDate / 30)
    }));
    const result = await savePayrollAction(dataToSave);
    
    if (result.success) {
      // Mock request approval logic
      setTimeout(() => {
        setIsSaving(false)
        toast.success("Payroll data has been saved and submitted to Finance Head for approval!")
      }, 1000)
    } else {
      setIsSaving(false)
      toast.error("Failed to save payroll data: " + result.error)
    }
  }

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    const newNo = payrollData.length > 0 ? Math.max(...payrollData.map(r => r.no)) + 1 : 1;
    
    // Default values for other fields
    const employeeToAdd = {
      no: newNo,
      name: newEmployee.name,
      position: newEmployee.position,
      section: newEmployee.section,
      basicSalary: newEmployee.basicSalary,
      forPensionContributionDeductionPurpose: newEmployee.basicSalary,
      accWorkingDate: 30,
      allowanceForServiceAssistance: newEmployee.basicSalary * 0.11, // 11% default
      allowanceForOvertime: 0,
      taxableIncome: newEmployee.basicSalary * (30 / 30), // basicSalary × (accWorkingDate/30)
      grossSalary: newEmployee.basicSalary * 1.11,
      receivable: 0
    };

    setPayrollData([...payrollData, employeeToAdd]);
    setIsAddModalOpen(false);
    setNewEmployee({ name: "", position: "", section: "All", basicSalary: 0 });
    toast.success("New employee added to the list.");
  };

  const handleInputChange = (no: number, field: string, value: string) => {
    // Parse as float, or default to 0 if input is empty/invalid
    const parsedValue = value === "" ? 0 : parseFloat(value);
    
    setPayrollData((prev) => 
      prev.map(row => row.no === no ? { ...row, [field]: parsedValue } : row)
    );
  };

  // Generate the full payroll data dynamically whenever state changes
  const processedData = useMemo(() => {
    return payrollData.map(row => {
      // Formula: Taxable Income = Basic Salary × (ACC/Working Date / 30)
      const taxableIncome = row.basicSalary * (row.accWorkingDate / 30);
      // System Calculation 1: Pay per day
      const payPerDay = row.basicSalary / 30;
      
      // System Calculation 2: Income Tax
      const incomeTax = calculateIncomeTax(taxableIncome);
      
      // System Calculation 3 & 4: Pension Funds (derived from Taxable Income)
      const pensionTax11 = taxableIncome * 0.11;
      const pension7 = taxableIncome * 0.07;
      
      // System Calculation 5: Total Deduction
      const totalDeduction = incomeTax + pensionTax11 + pension7;
      
      // System Calculation 6: Total Pension Fund
      const totalPensionFund = pensionTax11 + pension7;
      
      // System Calculation 7: Net Salary
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

  // Filter data based on search term
  const filteredData = processedData.filter((row) =>
    row.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.section.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate totals for UI summary
  const totalGrossSalary = filteredData.reduce((sum, row) => sum + row.grossSalary, 0)
  const totalNetPay = filteredData.reduce((sum, row) => sum + row.netPay, 0)
  const totalTaxes = filteredData.reduce((sum, row) => sum + row.incomeTax, 0)
  const totalPension = filteredData.reduce((sum, row) => sum + row.totalPensionFund, 0)

  // Export to CSV
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

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payroll_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payroll Management</h2>
          <p className="text-muted-foreground mt-1 flex items-center space-x-4">
            <span className="flex items-center"><Lock className="w-3 h-3 mr-1.5" /> Automated/Uneditable</span>
            <span className="flex items-center text-primary"><Edit2 className="w-3 h-3 mr-1.5" /> Editable Fields</span>
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/5">
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddEmployee}>
                <DialogHeader>
                  <DialogTitle>Add New Employee</DialogTitle>
                  <DialogDescription>
                    Fill in the details to add a new staff member to the payroll.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input
                      id="name"
                      required
                      className="col-span-3"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="position" className="text-right">Position</Label>
                    <Input
                      id="position"
                      required
                      className="col-span-3"
                      value={newEmployee.position}
                      onChange={(e) => setNewEmployee({ ...newEmployee, position: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="section" className="text-right">Section</Label>
                    <select
                      id="section"
                      className="col-span-3 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={newEmployee.section}
                      onChange={(e) => setNewEmployee({ ...newEmployee, section: e.target.value })}
                    >
                      <option value="KG">KG</option>
                      <option value="Elementary">Elementary</option>
                      <option value="Middle School">Middle School</option>
                      <option value="High School">High School</option>
                      <option value="All">All (Support/Admin)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="salary" className="text-right">Basic Salary</Label>
                    <Input
                      id="salary"
                      type="number"
                      required
                      className="col-span-3"
                      value={newEmployee.basicSalary || ""}
                      onChange={(e) => setNewEmployee({ ...newEmployee, basicSalary: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Employee</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button onClick={handleExportCSV} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm">
            <FileDown className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGrossSalary)}</div>
            <p className="text-xs text-muted-foreground pt-1">
              For all listed employees
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalNetPay)}</div>
            <p className="text-xs text-muted-foreground pt-1">
              Disbursed to employees
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income Tax</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalTaxes)}</div>
            <p className="text-xs text-muted-foreground pt-1">
              To be remitted to tax authority
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pension Fund</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPension)}</div>
            <p className="text-xs text-muted-foreground pt-1">
              Combined 7% & 11% contribution
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div>
              <CardTitle>Employee Payroll List</CardTitle>
              <CardDescription>
                Live spreadsheet. You can edit cells marked with <Edit2 className="inline w-3 h-3 mx-1 text-primary"/> directly.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search employees..."
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
                  <TableHead className="font-semibold min-w-[150px] border-r">Name</TableHead>
                  <TableHead className="font-semibold border-r">Position</TableHead>
                  <TableHead className="font-semibold border-r">Section</TableHead>
                  <TableHead className="font-semibold text-right border-r">Basic Salary</TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-primary/5 text-primary">
                    <span className="flex items-center justify-end"><Edit2 className="w-3 h-3 mr-1" /> For Pension Contrib.<br/>Deduction Purpose</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-muted/30">
                    <span className="flex items-center justify-end"><Lock className="w-3 h-3 mr-1" /> Pay per<br/>Day</span>
                  </TableHead>
                  <TableHead className="font-semibold text-center border-r whitespace-nowrap bg-primary/5 text-primary">
                    <span className="flex items-center justify-center"><Edit2 className="w-3 h-3 mr-1" /> ACC/Working<br/>Date</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-primary/5 text-primary">
                    <span className="flex items-center justify-end"><Edit2 className="w-3 h-3 mr-1" /> Allowance for<br/>Service Assistance</span>
                  </TableHead>
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-primary/5 text-primary">
                    <span className="flex items-center justify-end"><Edit2 className="w-3 h-3 mr-1" /> Allowance for<br/>Overtime</span>
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
                  <TableHead className="font-semibold text-right border-r whitespace-nowrap bg-primary/5 text-primary">
                    <span className="flex items-center justify-end"><Edit2 className="w-3 h-3 mr-1" /> Receivable</span>
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
                {isLoading ? (
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
                      <TableCell className="font-medium border-r">{row.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm border-r">{row.position}</TableCell>
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
                      
                      {/* Editable: For Pension Contribution Deduction Purpose */}
                      <TableCell className="text-right border-r p-1 bg-primary/5">
                        <Input 
                          type="number"
                          className="h-8 min-w-[100px] text-right bg-transparent border-transparent hover:border-input focus:bg-background transition-colors"
                          value={row.forPensionContributionDeductionPurpose || ""}
                          onChange={(e) => handleInputChange(row.no, "forPensionContributionDeductionPurpose", e.target.value)}
                        />
                      </TableCell>

                      <TableCell className="text-right border-r bg-muted/10 font-medium">{formatCurrency(row.payPerDay)}</TableCell>
                      
                      {/* Editable: ACC/Working Date */}
                      <TableCell className="text-center border-r p-1 bg-primary/5">
                        <Input 
                          type="number"
                          className="h-8 min-w-[80px] text-center bg-transparent border-transparent hover:border-input focus:bg-background transition-colors"
                          value={row.accWorkingDate || ""}
                          onChange={(e) => handleInputChange(row.no, "accWorkingDate", e.target.value)}
                        />
                      </TableCell>

                      {/* Editable: Allowance for Service Assistance */}
                      <TableCell className="text-right border-r p-1 bg-primary/5">
                        <Input 
                          type="number"
                          className="h-8 min-w-[100px] text-right bg-transparent border-transparent hover:border-input focus:bg-background transition-colors"
                          value={row.allowanceForServiceAssistance || ""}
                          onChange={(e) => handleInputChange(row.no, "allowanceForServiceAssistance", e.target.value)}
                        />
                      </TableCell>

                      {/* Editable: Allowance for Overtime */}
                      <TableCell className="text-right border-r p-1 bg-primary/5">
                        <Input 
                          type="number"
                          className="h-8 min-w-[100px] text-right bg-transparent border-transparent hover:border-input focus:bg-background transition-colors"
                          value={row.allowanceForOvertime || ""}
                          onChange={(e) => handleInputChange(row.no, "allowanceForOvertime", e.target.value)}
                        />
                      </TableCell>

                      <TableCell className="text-right border-r bg-muted/10 font-medium">{formatCurrency(row.pensionTax11)}</TableCell>
                      <TableCell className="text-right border-r bg-blue-50/30 dark:bg-blue-900/5 text-muted-foreground">{formatCurrency(row.taxableIncome)}</TableCell>
                      <TableCell className="text-right font-medium border-r bg-blue-50/30 dark:bg-blue-900/5 text-muted-foreground">{formatCurrency(row.grossSalary)}</TableCell>
                      <TableCell className="text-right border-r text-red-600/80 dark:text-red-400/80 bg-red-50/20 dark:bg-red-900/10 font-medium">{formatCurrency(row.incomeTax)}</TableCell>
                      <TableCell className="text-right border-r text-red-600/80 dark:text-red-400/80 bg-red-50/20 dark:bg-red-900/10 font-medium">{formatCurrency(row.pension7)}</TableCell>
                      <TableCell className="text-right font-bold border-r text-red-600/90 dark:text-red-400/90 bg-red-50/30 dark:bg-red-900/20">{formatCurrency(row.totalDeduction)}</TableCell>
                      
                      {/* Editable: Receivable */}
                      <TableCell className="text-right border-r p-1 bg-primary/5">
                        <Input 
                          type="number"
                          className="h-8 min-w-[100px] text-right bg-transparent border-transparent hover:border-input focus:bg-background transition-colors"
                          value={row.receivable || ""}
                          onChange={(e) => handleInputChange(row.no, "receivable", e.target.value)}
                        />
                      </TableCell>

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
          className="w-full sm:w-64 bg-primary hover:bg-primary/90 text-white shadow-lg transition-all hover:scale-105" 
          onClick={handleSaveAndRequest} 
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="flex items-center">
              <span className="animate-spin mr-2">⏳</span> Processing...
            </span>
          ) : (
            <span className="flex items-center">
              <Send className="mr-2 h-4 w-4" /> Save & Request Approval
            </span>
          )}
        </Button>
      </div>
    </div>
  )
}
