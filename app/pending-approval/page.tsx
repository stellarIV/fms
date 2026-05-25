"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, LogOut } from "lucide-react";

export default function PendingApprovalPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="max-w-md w-full border-muted/60 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Account Pending</CardTitle>
          <CardDescription className="text-base mt-2">
            Your account is currently waiting for administrator approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground pb-6">
          <p>
            You have successfully registered, but an administrator needs to assign your role before you can access the portal. Please check back later or contact the school administration if you need immediate access.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-muted/50 pt-6">
          <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto gap-2 font-medium">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
