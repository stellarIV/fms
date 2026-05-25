"use client";

import { useState } from "react";
import { sendEmployeeSalary, sendAllSalaries } from "@/app/actions/payroll-chapa";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Zap, Send } from "lucide-react";
import { toast } from "sonner";

type Employee = {
  id: string;
  no: number;
  name: string;
  position: string;
  section: string;
  receivable: number;
  email: string | null;
  bankAccount: string | null;
};

type PayStatus = "idle" | "sending" | "success" | "error";

export function PayrollPayClient({ employees }: { employees: Employee[] }) {
  const [statuses, setStatuses] = useState<Record<string, { status: PayStatus; error?: string }>>({});
  const [sendingAll, setSendingAll] = useState(false);
  const [summary, setSummary] = useState<{ succeeded: number; failed: number } | null>(null);

  function setStatus(id: string, status: PayStatus, error?: string) {
    setStatuses(prev => ({ ...prev, [id]: { status, error } }));
  }

  async function handleSendOne(employee: Employee) {
    setStatus(employee.id, "sending");
    const result = await sendEmployeeSalary(employee.id);
    if (result.success) {
      setStatus(employee.id, "success");
      toast.success(`Sent ${result.amount?.toLocaleString()} ETB to ${employee.name}`);
    } else {
      setStatus(employee.id, "error", result.error);
      toast.error(`Failed for ${employee.name}: ${result.error}`);
    }
  }

  async function handleSendAll() {
    setSendingAll(true);
    setSummary(null);
    employees.forEach(e => setStatus(e.id, "sending"));

    const result = await sendAllSalaries();
    setSendingAll(false);

    if (result.results) {
      result.results.forEach((r, i) => {
        const emp = employees[i];
        if (emp) setStatus(emp.id, r.success ? "success" : "error", r.error);
      });
      setSummary({ succeeded: result.succeeded ?? 0, failed: result.failed ?? 0 });
      toast.success(`Done: ${result.succeeded} paid, ${result.failed} failed`);
    } else {
      toast.error(result.error || "Failed to send salaries.");
      employees.forEach(e => setStatus(e.id, "idle"));
    }
  }

  const allDone = employees.every(e => statuses[e.id]?.status === "success");
  const totalPaid = employees
    .filter(e => statuses[e.id]?.status === "success")
    .reduce((sum, e) => sum + (e.receivable || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {summary && (
          <div className="flex gap-3">
            <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 px-3 py-1">
              <CheckCircle2 className="h-3 w-3" /> {summary.succeeded} Paid
            </Badge>
            {summary.failed > 0 && (
              <Badge variant="destructive" className="gap-1 px-3 py-1">
                <XCircle className="h-3 w-3" /> {summary.failed} Failed
              </Badge>
            )}
            <Badge variant="outline" className="gap-1 px-3 py-1">
              {totalPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB sent
            </Badge>
          </div>
        )}
        <Button
          onClick={handleSendAll}
          disabled={sendingAll || allDone}
          className="bg-green-600 hover:bg-green-700 text-white gap-2"
        >
          {sendingAll ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending All...</>
          ) : allDone ? (
            <><CheckCircle2 className="h-4 w-4" /> All Paid</>
          ) : (
            <><Zap className="h-4 w-4" /> Pay All Employees via Chapa</>
          )}
        </Button>
      </div>

      {/* Employee table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">No</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Position</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Section</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Salary</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bank Account</th>
              <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => {
              const s = statuses[emp.id];
              return (
                <tr key={emp.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{emp.no}</td>
                  <td className="px-4 py-2 font-medium">{emp.name}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{emp.position}</td>
                  <td className="px-4 py-2 text-muted-foreground text-xs">{emp.section}</td>
                  <td className="px-4 py-2 text-right font-semibold">
                    {(emp.receivable || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB
                  </td>
                  <td className="px-4 py-2 text-muted-foreground text-xs font-mono">
                    {emp.bankAccount || <span className="text-orange-500">Not set</span>}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {!s || s.status === "idle" ? (
                      <Badge variant="outline" className="text-xs">Pending</Badge>
                    ) : s.status === "sending" ? (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin" /> Sending
                      </Badge>
                    ) : s.status === "success" ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Paid
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 text-xs" title={s.error}>
                        <XCircle className="h-3 w-3" /> Failed
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={s?.status === "sending" || s?.status === "success"}
                      onClick={() => handleSendOne(emp)}
                      className="h-7 text-xs gap-1"
                    >
                      {s?.status === "sending" ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : s?.status === "success" ? (
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      ) : (
                        <><Send className="h-3 w-3" /> Send</>
                      )}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
