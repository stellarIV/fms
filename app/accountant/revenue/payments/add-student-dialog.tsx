"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function AddStudentDialog({ month, year }: { month: number; year: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ rollNo: "", name: "", paymentCode: "" });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create student
      const studentRes = await fetch("/api/payments/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const studentData = await studentRes.json();
      if (!studentRes.ok) throw new Error(studentData.error);

      // 2. Create blank payment for current period
      const paymentRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: studentData.id,
          month,
          year,
          totalPayment: 0,
        }),
      });
      if (!paymentRes.ok) {
        const pd = await paymentRes.json();
        throw new Error(pd.error);
      }

      setOpen(false);
      setForm({ rollNo: "", name: "", paymentCode: "" });
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogDescription>
            Creates the student profile and a payment record for the current period.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="rollNo">Roll No</Label>
            <Input
              id="rollNo"
              placeholder="e.g. 001"
              value={form.rollNo}
              onChange={e => setForm(f => ({ ...f, rollNo: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Student's full name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="paymentCode">Payment Code</Label>
            <Input
              id="paymentCode"
              placeholder="Unique bank matching code"
              value={form.paymentCode}
              onChange={e => setForm(f => ({ ...f, paymentCode: e.target.value }))}
              required
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? "Saving…" : "Create Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
