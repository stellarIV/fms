import { db } from "@/db";
import { payroll } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Lock } from "lucide-react";

export default async function SMPayrollPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "school_manager") redirect("/login");

  const employees = await db.select().from(payroll).orderBy(payroll.no);

  return (
    <div className="flex flex-col gap-4 w-full max-w-[1400px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Payroll Overview</h1>
        <p className="text-sm text-muted-foreground">Read-only summary of staff payroll. Contact the accountant to make changes.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" /> Staff Payroll
          </CardTitle>
          <CardDescription>{employees.length} employees on record</CardDescription>
        </CardHeader>
        <CardContent className="p-0 overflow-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-semibold">No</TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Position</TableHead>
                <TableHead className="font-semibold">Section</TableHead>
                <TableHead className="font-semibold text-right">Basic Salary (ETB)</TableHead>
                <TableHead className="font-semibold text-right">Gross Salary (ETB)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No payroll records found.</TableCell></TableRow>
              ) : employees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell className="font-mono text-xs">{emp.no}</TableCell>
                  <TableCell className="font-medium">{emp.name}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{emp.section}</TableCell>
                  <TableCell className="text-right">{emp.basicSalary.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-semibold">{emp.grossSalary.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
