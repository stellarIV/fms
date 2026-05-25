"use client";

import { useState, useMemo } from "react";
import { createStudentAccount, removeStudentAccount } from "@/app/actions/users";
import { getGradeFromPaymentCode } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Student = {
  id: string;
  name: string;
  rollNo: string;
  paymentCode: string;
  userId: string | null;
};

export function StudentsClient({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "linked" | "unlinked">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.rollNo.toLowerCase().includes(search.toLowerCase());
      const matchFilter =
        filter === "all" ||
        (filter === "linked" && s.userId) ||
        (filter === "unlinked" && !s.userId);
      return matchSearch && matchFilter;
    });
  }, [students, search, filter]);

  const linked = students.filter((s) => s.userId).length;
  const unlinked = students.length - linked;

  function openCreate(student: Student) {
    setSelected(student);
    setEmail("");
    setPassword(student.rollNo);
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!selected || !email || !password) return;
    setLoading(true);
    const result = await createStudentAccount(selected.id, email, password);
    setLoading(false);
    if (result.success) {
      toast.success(`Account created for ${selected.name}`);
      setDialogOpen(false);
    } else {
      toast.error(result.error);
    }
  }

  async function handleRemove(student: Student) {
    if (!confirm(`Remove account for ${student.name}? They will no longer be able to log in.`)) return;
    const result = await removeStudentAccount(student.id);
    if (result.success) {
      toast.success("Account removed.");
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Students</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{students.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Accounts Created</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{linked}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">No Account Yet</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-500">{unlinked}</p></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll no..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "linked", "unlinked"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Roll No</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Grade</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Account</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{s.rollNo}</td>
                <td className="px-4 py-3 text-muted-foreground">{getGradeFromPaymentCode(s.paymentCode)}</td>
                <td className="px-4 py-3">
                  {s.userId ? (
                    <Badge variant="default" className="bg-green-100 text-green-700 border-green-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300 gap-1">
                      <XCircle className="h-3 w-3" /> No Account
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {s.userId ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleRemove(s)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => openCreate(s)}>
                      <UserPlus className="h-4 w-4 mr-1" /> Create Account
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Account — {selected?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm bg-muted/40 rounded-lg p-3">
              <div><span className="text-muted-foreground">Roll No:</span> <span className="font-medium">{selected?.rollNo}</span></div>
              <div><span className="text-muted-foreground">Grade:</span> <span className="font-medium">{selected ? getGradeFromPaymentCode(selected.paymentCode) : ""}</span></div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="student@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input
                type="text"
                placeholder="Temp password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Default is the student's roll number. Student can change it later.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={loading || !email || !password}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
