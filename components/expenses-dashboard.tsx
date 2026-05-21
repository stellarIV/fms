import { db } from "@/db"
import { purchaseOrder, expenseRequest, payroll } from "@/db/schema"
import { sql, desc, eq, and } from "drizzle-orm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, DollarSign, FileText, Users, Activity, Clock, CheckCircle2, AlertCircle, PieChart } from "lucide-react"
import { format } from "date-fns"

export default async function ExpensesDashboard() {
  // 1. Total Expenses (Approved/Submitted Purchase Orders)
  const [poStats] = await db.select({
    total: sql<number>`COALESCE(sum(${purchaseOrder.totalAmount}), 0)`,
    count: sql<number>`count(${purchaseOrder.id})`,
  }).from(purchaseOrder)
    .where(eq(purchaseOrder.status, "Approved"));

  // 2. Pending Requests
  const [pendingStats] = await db.select({
    count: sql<number>`count(${expenseRequest.id})`,
  }).from(expenseRequest)
    .where(eq(expenseRequest.status, "Pending"));

  // 3. Monthly Payroll Total
  const [payrollStats] = await db.select({
    total: sql<number>`COALESCE(sum(${payroll.grossSalary}), 0)`,
    count: sql<number>`count(${payroll.id})`,
  }).from(payroll);

  // 4. Recent Purchase Orders
  const recentOrders = await db.query.purchaseOrder.findMany({
    orderBy: [desc(purchaseOrder.updatedAt)],
    limit: 5,
    with: {
      expenseRequest: true,
    }
  });

  // 5. Recent Expense Requests
  const recentRequests = await db.query.expenseRequest.findMany({
    orderBy: [desc(expenseRequest.createdAt)],
    limit: 5,
  });

  // 6. Expenses by Section (from Purchase Orders)
  const expensesBySection = await db.select({
    section: purchaseOrder.targetSection,
    total: sql<number>`sum(${purchaseOrder.totalAmount})`,
  }).from(purchaseOrder)
    .groupBy(purchaseOrder.targetSection)
    .orderBy(sql`sum(${purchaseOrder.totalAmount}) desc`);

  return (
    <div className="flex flex-col gap-8 p-2 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Financial Expenditures
        </h1>
        <p className="text-muted-foreground text-lg">
          A high-fidelity overview of the school's resource allocation and cash flow.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow border-none bg-gradient-to-br from-red-500/10 via-background to-background">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <DollarSign className="h-20 w-20 text-red-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">Total Procurement</CardTitle>
            <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-xl shadow-inner">
              <DollarSign className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black tracking-tighter">{Number(poStats.total).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">ETB</span></div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-red-600/80 dark:text-red-400/80">
               <Activity className="h-3 w-3" />
               <span>From {Number(poStats.count)} approved orders</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow border-none bg-gradient-to-br from-blue-500/10 via-background to-background">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Users className="h-20 w-20 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Monthly Payroll</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-xl shadow-inner">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black tracking-tighter">{Number(payrollStats.total).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">ETB</span></div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
               <CheckCircle2 className="h-3 w-3" />
               <span>For {Number(payrollStats.count)} active employees</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow border-none bg-gradient-to-br from-amber-500/10 via-background to-background">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Clock className="h-20 w-20 text-amber-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Pending Requests</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl shadow-inner">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black tracking-tighter">{Number(pendingStats.count)}</div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-600/80 dark:text-amber-400/80">
               <AlertCircle className="h-3 w-3" />
               <span>Awaiting manager review</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden shadow-md hover:shadow-lg transition-shadow border-none bg-gradient-to-br from-purple-500/10 via-background to-background">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <Activity className="h-20 w-20 text-purple-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Total Outflow</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-xl shadow-inner">
              <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-black tracking-tighter">{(Number(poStats.total) + Number(payrollStats.total)).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">ETB</span></div>
            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-purple-600/80 dark:text-purple-400/80">
               <DollarSign className="h-3 w-3" />
               <span>Total approved expenditure</span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-md border-none ring-1 ring-border/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Expenditure by Department</CardTitle>
            <CardDescription>Sectional distribution of approved purchase orders.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-6">
              {expensesBySection.length === 0 ? (
                <div className="h-[250px] flex flex-col items-center justify-center border-dashed border-2 rounded-2xl bg-muted/5">
                   <div className="p-4 bg-muted/10 rounded-full mb-3">
                     <PieChart className="h-10 w-10 text-muted-foreground/30" />
                   </div>
                   <p className="text-muted-foreground font-medium">No departmental spending data yet.</p>
                </div>
              ) : (
                expensesBySection.map((item) => (
                  <div key={item.section} className="space-y-2 group">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-foreground/80 group-hover:text-primary transition-colors">{item.section || "General / Admin"}</span>
                      <span className="font-mono font-semibold">{Number(item.total).toLocaleString()} ETB</span>
                    </div>
                    <div className="w-full bg-secondary/50 h-3 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-primary/80 to-primary h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(var(--primary),0.3)]" 
                        style={{ width: `${(Number(item.total) / (Number(poStats.total) || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-md border-none ring-1 ring-border/50 bg-muted/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">Recent Fulfillment</CardTitle>
              <CardDescription>
                Latest approved purchase orders.
              </CardDescription>
            </div>
            <div className="p-2 bg-background rounded-lg border shadow-sm">
              <FileText className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/10 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">Clear fulfillment queue.</p>
                </div>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-background hover:shadow-sm transition-all border border-transparent hover:border-border/50 group">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                      order.status === "Approved" ? "bg-green-500/10 text-green-600 dark:text-green-400 group-hover:bg-green-500 group-hover:text-white" : 
                      order.status === "Submitted" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white" : 
                      "bg-muted text-muted-foreground"
                    }`}>
                      {order.status === "Approved" ? <CheckCircle2 className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate leading-tight group-hover:text-primary transition-colors">
                        {order.itemDescription || "Inventory Item"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate font-medium">
                        {order.targetSection} • {order.updatedAt ? format(new Date(order.updatedAt), "MMM d") : "Today"}
                      </p>
                    </div>
                    <div className="text-sm font-black whitespace-nowrap bg-muted/50 px-2 py-1 rounded-md">
                      {order.totalAmount?.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-none ring-1 ring-border/50 overflow-hidden">
        <CardHeader className="bg-muted/5 border-b">
          <CardTitle className="text-xl font-bold">Incoming Expense Requests</CardTitle>
          <CardDescription>Real-time stream of procurement requests from school operations.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="bg-muted/20">
                <tr className="border-b transition-colors">
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">No.</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Asset/Service</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Operational Purpose</th>
                  <th className="h-12 px-6 text-left align-middle font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Quantity</th>
                  <th className="h-12 px-6 text-center align-middle font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Status</th>
                  <th className="h-12 px-6 text-right align-middle font-semibold text-muted-foreground uppercase tracking-widest text-[10px]">Date Logged</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {recentRequests.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="h-32 text-center text-muted-foreground font-medium italic">The request log is currently empty.</td>
                   </tr>
                ) : (
                  recentRequests.map((req) => (
                    <tr key={req.id} className="border-b transition-all hover:bg-primary/5 group">
                      <td className="px-6 py-4 align-middle font-bold text-primary">#{req.no}</td>
                      <td className="px-6 py-4 align-middle font-semibold">{req.objectType}</td>
                      <td className="px-6 py-4 align-middle max-w-[300px] truncate text-muted-foreground group-hover:text-foreground transition-colors">{req.requestPurpose}</td>
                      <td className="px-6 py-4 align-middle font-medium italic">{req.quantity} {req.measure}</td>
                      <td className="px-6 py-4 align-middle text-center">
                        <div className={`inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-tighter transition-all ${
                          req.status === "Pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 ring-1 ring-amber-500/20" :
                          req.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400 ring-1 ring-green-500/20" :
                          req.status === "Rejected" ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-400 ring-1 ring-red-500/20" :
                          "bg-muted text-muted-foreground ring-1 ring-border"
                        }`}>
                          {req.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-right text-muted-foreground font-mono text-xs">{format(new Date(req.createdAt), "MMM d, yyyy")}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
