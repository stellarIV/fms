"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, RefreshCw } from "lucide-react";
import { format, isToday } from "date-fns";
import { getTodaysCumulativeReport } from "@/app/actions/reports";
import { toast } from "sonner";

type ReportType = {
  id: string;
  reportDate: Date;
  reporterEmail: string;
  reporterName?: string | null;
  csvData: string;
};

function triggerDownload(csvData: string, filename: string) {
  const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ReportsClient({ initialReports, readOnlyMode = false }: { initialReports: ReportType[], readOnlyMode?: boolean }) {
  const [reports] = useState<ReportType[]>(initialReports);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [fetchingToday, setFetchingToday] = useState(false);

  /** For today's report: always re-fetch from DB to get the latest cumulative data. */
  const handleDownload = async (report: ReportType) => {
    const reportIsToday = isToday(new Date(report.reportDate));
    const dateStr = format(new Date(report.reportDate), "yyyy-MM-dd");
    const filename = `daily_report_${dateStr}.csv`;

    if (reportIsToday) {
      setLoadingId(report.id);
      try {
        const result = await getTodaysCumulativeReport();
        if (result.csvData) {
          triggerDownload(result.csvData, filename);
        } else {
          toast.error(result.error || "Failed to fetch today's cumulative report.");
        }
      } finally {
        setLoadingId(null);
      }
    } else {
      // For past reports use the stored snapshot (already final)
      triggerDownload(report.csvData, filename);
    }
  };

  /** Standalone button: always fetches today's latest cumulative CSV from DB */
  const handleDownloadToday = async () => {
    setFetchingToday(true);
    try {
      const result = await getTodaysCumulativeReport();
      if (result.csvData) {
        const today = format(new Date(), "yyyy-MM-dd");
        triggerDownload(result.csvData, `daily_report_${today}.csv`);
        toast.success("Downloaded today's full cumulative report.");
      } else if (result.error) {
        toast.error(result.error);
      } else {
        toast.info("No report has been generated for today yet.");
      }
    } finally {
      setFetchingToday(false);
    }
  };

  return (
    <div className="w-full">
      {/* Today's cumulative download shortcut */}
      {!readOnlyMode && (
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex flex-col">
          <p className="text-sm font-semibold">Today&apos;s Cumulative Report</p>
          <p className="text-xs text-muted-foreground">
            Downloads the full merged CSV for all data saved today — across all sessions and months.
          </p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={handleDownloadToday}
          disabled={fetchingToday}
          className="gap-2 shrink-0"
        >
          {fetchingToday ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Download Today&apos;s CSV
        </Button>
      </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Report Date</TableHead>
            <TableHead>Reporter Name</TableHead>
            <TableHead>Reporter Email</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground/50" />
                  <p>No daily reports have been generated yet.</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            reports.map((report) => {
              const reportIsToday = isToday(new Date(report.reportDate));
              return (
                <TableRow key={report.id} className={reportIsToday ? "bg-primary/5" : ""}>
                  <TableCell className="font-mono text-xs">{report.id.slice(0, 8)}...</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {format(new Date(report.reportDate), "PPP")}
                      {reportIsToday && (
                        <span className="text-[10px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                          TODAY
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{report.reporterName || "N/A"}</TableCell>
                  <TableCell>{report.reporterEmail}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report)}
                      disabled={loadingId === report.id}
                      className="gap-2"
                    >
                      {loadingId === report.id ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {reportIsToday ? "Download Latest CSV" : "Download CSV"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
