import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react"

export default async function FinanceHeadDemoPage(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const { slug } = await props.params;
  const path = slug ? slug.join("/") : "dashboard";
  
  const titleMap: Record<string, string> = {
    "dashboard": "Overview Dashboard",
    "revenue/dashboard": "Revenue Overview",
    "revenue/payments": "Payments Demo",
    "revenue/invoices": "Invoices Demo",
    "revenue/transactions": "Transactions Demo",
    "revenue/audit-log": "Revenue Audit Log Demo",
    "revenue/reports": "Revenue Reports Demo",
    "expenses/dashboard": "Expenses Overview",
    "expenses/orders": "Purchase Orders Demo",
    "expenses/payroll": "Payroll Demo",
    "settings": "Settings Demo"
  };

  const pageTitle = titleMap[path] || "Demo Page";

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="text-muted-foreground">
          This is a demonstration page for the Finance Head role. The sidebar reflects the accountant interface, populated with sample data.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ETB 245,231.89</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">ETB 132,450.00</div>
            <p className="text-xs text-muted-foreground">+4% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+1,203</div>
            <p className="text-xs text-muted-foreground">+12 new registrations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+46%</div>
            <p className="text-xs text-muted-foreground">Healthy financial status</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity (Demo)</CardTitle>
          <CardDescription>A list of recent transactions and activities.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>2026-05-02</TableCell>
                  <TableCell className="font-medium">Monthly Tuition Collection</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell className="text-emerald-500 font-medium">+ETB 45,000.00</TableCell>
                  <TableCell><Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2026-05-01</TableCell>
                  <TableCell className="font-medium">Staff Payroll (May)</TableCell>
                  <TableCell>Expense</TableCell>
                  <TableCell className="text-rose-500 font-medium">-ETB 112,450.00</TableCell>
                  <TableCell><Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2026-04-28</TableCell>
                  <TableCell className="font-medium">Stationery Purchase</TableCell>
                  <TableCell>Expense</TableCell>
                  <TableCell className="text-rose-500 font-medium">-ETB 3,200.00</TableCell>
                  <TableCell><Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Pending Approval</Badge></TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>2026-04-25</TableCell>
                  <TableCell className="font-medium">Registration Fees (Late)</TableCell>
                  <TableCell>Revenue</TableCell>
                  <TableCell className="text-emerald-500 font-medium">+ETB 12,500.00</TableCell>
                  <TableCell><Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Completed</Badge></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
