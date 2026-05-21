import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3, Construction } from "lucide-react";

export default async function SMBudgetPlanPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== "school_manager") redirect("/login");

  return (
    <div className="flex flex-col gap-4 w-full max-w-[900px] mx-auto">
      <div className="flex flex-col gap-1 border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Budget Plan</h1>
        <p className="text-sm text-muted-foreground">Annual and monthly budget planning for school operations.</p>
      </div>
      <Card className="border-dashed">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mb-2">
            <Construction className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-lg">Coming Soon</CardTitle>
          <CardDescription className="max-w-md mx-auto">
            The Budget Plan module is under development. It will allow you to define annual budgets by department,
            track expenditures against allocations, and generate budget vs. actuals reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            {["Annual Budget Setup", "Department Allocations", "Budget vs. Actuals Report"].map(f => (
              <div key={f} className="rounded-lg border border-dashed bg-muted/30 p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4 shrink-0 text-amber-500" />
                {f}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
