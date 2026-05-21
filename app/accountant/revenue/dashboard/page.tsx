import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, DollarSign, Users, Activity, Receipt, CreditCard } from "lucide-react"
import { db } from "@/db"
import { monthlyPayment, student } from "@/db/schema"
import { sql, desc, gt } from "drizzle-orm"
import { format } from "date-fns"

export default async function RevenueDashboard() {
  const [revenueStats] = await db.select({
    total: sql<number>`COALESCE(sum(${monthlyPayment.totalPayment}), 0)`,
    pending: sql<number>`COALESCE(sum(${monthlyPayment.pendingFee}), 0)`,
  }).from(monthlyPayment);

  const [studentStats] = await db.select({
    count: sql<number>`count(${student.id})`,
  }).from(student);

  // Today's revenue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [todayStats] = await db.select({
    total: sql<number>`COALESCE(sum(${monthlyPayment.totalPayment}), 0)`,
  }).from(monthlyPayment)
    .where(sql`${monthlyPayment.updatedAt} >= ${today}`);

  const recentPayments = await db.query.monthlyPayment.findMany({
    orderBy: [desc(monthlyPayment.updatedAt)],
    limit: 5,
    with: {
      student: true,
    },
    where: gt(monthlyPayment.totalPayment, 0)
  });

  return (
    <div className="flex flex-col gap-6 p-1">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Revenue Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time overview of your school's financial performance and revenue streams.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-full">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(revenueStats.total).toLocaleString()} ETB</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cumulative collection to date
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-full">
              <ArrowDownRight className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.abs(Number(revenueStats.pending)).toLocaleString()} ETB</div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding student balances
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Number(studentStats.count).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total enrolled students
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full">
              <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{Number(todayStats.total).toLocaleString()} ETB</div>
            <p className="text-xs text-muted-foreground mt-1">
              Collected since midnight
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Revenue Insights</CardTitle>
            <CardDescription>Visual breakdown of monthly revenue collections.</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] flex flex-col items-center justify-center border-dashed border-2 m-4 rounded-lg bg-muted/5">
            <div className="p-4 bg-muted/20 rounded-full mb-4">
              <Activity className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">Revenue Trend Analysis</p>
            <p className="text-xs text-muted-foreground max-w-[250px] text-center mt-2">
              Charts will be populated as more historical data becomes available in the system.
            </p>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Last {recentPayments.length} payments recorded.
              </CardDescription>
            </div>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentPayments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CreditCard className="h-10 w-10 text-muted-foreground/20 mb-2" />
                  <p className="text-sm text-muted-foreground">No recent transactions found.</p>
                </div>
              ) : (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center gap-4 group">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {payment.student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate leading-none">
                        {payment.student.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">
                        {payment.receiptNumber || "No Receipt"} • {payment.updatedAt ? format(new Date(payment.updatedAt), "MMM d, h:mm a") : "Recently"}
                      </p>
                    </div>
                    <div className="text-sm font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                      +{payment.totalPayment.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

