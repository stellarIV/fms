import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Users, FileText, Activity, Clock } from "lucide-react"
import { db } from "@/db"
import { payroll, expenseRequest, auditLog, student as studentTable } from "@/db/schema"
import { eq, or, desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getGradeFromPaymentCode } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default async function PrincipalDashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  if (!session || !session.user.role?.startsWith("principal")) {
    redirect("/login");
  }

  const role = session.user.role;

  // Map role to payroll section
  const roleToSection: Record<string, string> = {
    principal_kg: "KG",
    principal_elementary: "Elementary",
    principal_middle: "Middle School",
    principal_high: "High School"
  };
  const principalSection = roleToSection[role] || "All";

  // Fetch staff
  const staff = await db.query.payroll.findMany({
    where: or(
      eq(payroll.section, principalSection),
      eq(payroll.section, "All")
    )
  });

  // Fetch students and filter by section
  const allStudents = await db.query.student.findMany();
  const students = allStudents.filter(p => {
    const grade = getGradeFromPaymentCode(p.paymentCode);
    if (role === "principal_kg") return grade.startsWith("KG");
    if (role === "principal_elementary") return ["Grade 1", "Grade 2", "Grade 3", "Grade 4"].includes(grade);
    if (role === "principal_middle") return ["Grade 5", "Grade 6", "Grade 7", "Grade 8"].includes(grade);
    if (role === "principal_high") return ["Grade 9", "Grade 10", "Grade 11", "Grade 12"].includes(grade);
    return true;
  });

  // Fetch Expense Requests
  const requests = await db.query.expenseRequest.findMany({
    where: eq(expenseRequest.requesterId, session.user.id),
    orderBy: [desc(expenseRequest.createdAt)],
  });

  const pendingRequests = requests.filter(r => r.status === "Pending").length;
  const draftRequests = requests.filter(r => r.status === "Draft").length;

  // Fetch Audit Logs (Recent activities)
  const logs = await db.query.auditLog.findMany({
    where: eq(auditLog.changerRole, role),
    orderBy: [desc(auditLog.createdAt)],
    limit: 6
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students in Section</CardTitle>
            <GraduationCap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Enrolled students</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Section Staff</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active employees</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting evaluation</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Requests</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{draftRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">Not yet submitted</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Expense Requests
            </CardTitle>
            <CardDescription>Your latest submitted and drafted requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                <FileText className="h-8 w-8 mb-3 opacity-50" />
                <p>No expense requests found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.slice(0, 5).map((req) => (
                  <div key={req.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{req.objectType}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{req.objectDescription}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground pt-1">
                        <span>No: {req.no}</span>
                        <span>•</span>
                        <span>Qty: {req.quantity} {req.measure}</span>
                      </div>
                    </div>
                    <Badge variant={req.status === "Draft" ? "secondary" : req.status === "Pending" ? "outline" : "default"}>
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activities
            </CardTitle>
            <CardDescription>Your latest actions in the portal.</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                 <Clock className="h-8 w-8 mb-3 opacity-50" />
                 <p>No recent activity found.</p>
               </div>
            ) : (
              <div className="space-y-6">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start">
                    <div className="mt-0.5 bg-primary/10 p-1.5 rounded-full mr-3">
                      <Activity className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{log.changeDescription}</p>
                      <p className="text-xs text-muted-foreground">
                        {log.createdAt.toLocaleDateString()} at {log.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
