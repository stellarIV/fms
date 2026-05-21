"use client";

import { useState, useRef } from "react";
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
import { Upload, Loader2, FileCheck2, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface ImportResult {
  created: number;
  updated: number;
  errors: string[];
}

export function CsvImportDialog({ month, year }: { month: number; year: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImport = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const text = await file.text();
      const res = await fetch(`/api/payments/import?month=${month}&year=${year}`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: text,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      setResult(data);
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
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Bank Statement (CSV)</DialogTitle>
          <DialogDescription>
            Upload a CSV file. Required columns:{" "}
            <code className="bg-muted px-1 rounded text-xs font-mono">
              Payment Code, Total Payment
            </code>. Optional: <code className="bg-muted px-1 rounded text-xs font-mono">Bank Date, Receipt Number</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Sample format hint */}
          <div className="rounded-md bg-muted p-3 text-xs font-mono text-muted-foreground leading-relaxed">
            Payment Code, Total Payment, Receipt Number, Bank Date<br />
            STU001, 2300, VOUCH-123, 2025-09-15<br />
            STU002, 1700, VOUCH-456, 2025-09-08
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input id="csv-file" type="file" accept=".csv" ref={fileRef} />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 text-destructive p-3 text-sm">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 text-sm space-y-1">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                <FileCheck2 className="h-4 w-4" />
                Import Complete
              </div>
              <p className="text-muted-foreground">
                {result.created} created · {result.updated} updated
              </p>
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">Errors ({result.errors.length}):</p>
                  <ul className="list-disc list-inside text-[11px] text-yellow-600 dark:text-yellow-400 space-y-0.5">
                    {result.errors.map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleImport} disabled={loading} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing…</>
            ) : "Import"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
