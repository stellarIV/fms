import { getStudentPayments } from "@/app/actions/chapa";
import { getGradeFromPaymentCode } from "@/lib/utils";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CreditCard, BookOpen, GraduationCap, Bus, AlertCircle, CheckCircle2 } from "lucide-react";

export default async function StudentDashboardPage() {
  const result = await getStudentPayments();
  if (!result.success || !result.data) redirect("/login");

  const { student, payments } = result.data;
  const grade = getGradeFromPaymentCode(student.paymentCode);

  // Current month = most recent payment record
  const current = payments[0] ?? null;
  const totalPaid = payments.reduce((sum, p) => sum + (p.totalPayment || 0), 0);
  const totalDue = payments.reduce((sum, p) => sum + (p.totalMonthlyFee || 0), 0);
  const totalBalance = payments.reduce((sum, p) => sum + (p.penaltyFee || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{student.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm">
            <span className="flex items-center gap-1"><GraduationCap className="h-4 w-4" /> {grade}</span>
            <span>Roll No: {student.rollNo}</span>
          </div>
        </div>
        {current && (
          <Button asChild>
            <Link href="/student/pay"><CreditCard className="h-4 w-4 mr-2" />Pay Fees</Link>
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Total Paid</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{totalPaid.toLocaleString()} ETB</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Total Due</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalDue.toLocaleString()} ETB</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Outstanding</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalBalance > 0 ? "text-red-600" : "text-green-600"}`}>
              {totalBalance.toLocaleString()} ETB
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wide">Months</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{payments.length}</p></CardContent>
        </Card>
      </div>

      {/* Current Month Breakdown */}
      {current && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Current Month — Month {current.month}/{current.year}</span>
              {current.penaltyFee > 0 ? (
                <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" />Balance Due</Badge>
              ) : current.totalPayment > 0 ? (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1"><CheckCircle2 className="h-3 w-3" />Paid</Badge>
              ) : (
                <Badge variant="outline">Pending</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 text-sm"><BookOpen className="h-4 w-4 text-muted-foreground" />Tuition</div>
                  <span className="font-semibold">{(current.tuitionFee || 0).toLocaleString()} ETB</span>
                </div>
                {(current.transportFee || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-sm"><Bus className="h-4 w-4 text-muted-foreground" />Transport</div>
                    <span className="font-semibold">{current.transportFee.toLocaleString()} ETB</span>
                  </div>
                )}
                {(current.registrationFee || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400">Registration (once)</div>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">{current.registrationFee.toLocaleString()} ETB</span>
                  </div>
                )}
                {(current.libraryFee || 0) > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                    <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-400">Library (once)</div>
                    <span className="font-semibold text-purple-700 dark:text-purple-400">{current.libraryFee.toLocaleString()} ETB</span>
                  </div>
                )}
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-semibold">Total Due</span>
                <span className="text-lg font-bold">{(current.totalMonthlyFee || 0).toLocaleString()} ETB</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="text-green-600 font-medium">{(current.totalPayment || 0).toLocaleString()} ETB</span>
              </div>
              {(current.penaltyFee || 0) > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-red-600 font-medium">Remaining Balance</span>
                  <span className="text-red-600 font-bold">{current.penaltyFee.toLocaleString()} ETB</span>
                </div>
              )}
              {(current.penaltyFee || 0) > 0 && (
                <Button asChild className="w-full mt-2">
                  <Link href="/student/pay"><CreditCard className="h-4 w-4 mr-2" />Pay {current.penaltyFee.toLocaleString()} ETB Now</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
