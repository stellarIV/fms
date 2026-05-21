"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ShieldCheck, 
  Database, 
  FileDown, 
  UserPlus, 
  AlertCircle,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";

const DEMO_LOGS = [
  {
    id: "LOG-001",
    timestamp: "2024-04-30 15:10:22",
    user: "biruk@fms.com",
    action: "Updated Payment",
    resource: "Student R-101",
    type: "Data",
    details: "Changed totalPayment from 0 to 1500 ETB",
  },
  {
    id: "LOG-002",
    timestamp: "2024-04-30 14:45:10",
    user: "biruk@fms.com",
    action: "Exported CSV",
    resource: "Daily Report",
    type: "Export",
    details: "Downloaded daily report for 2024-04-30",
  },
  {
    id: "LOG-003",
    timestamp: "2024-04-30 12:30:05",
    user: "admin@fms.com",
    action: "User Login",
    resource: "System Auth",
    type: "Security",
    details: "Successful login from IP 192.168.1.105",
  },
  {
    id: "LOG-004",
    timestamp: "2024-04-30 10:15:33",
    user: "biruk@fms.com",
    action: "Added Student",
    resource: "Student Directory",
    type: "Data",
    details: "Created new student profile: Dawit Lema (R-105)",
  },
  {
    id: "LOG-005",
    timestamp: "2024-04-29 18:20:00",
    user: "system",
    action: "Database Backup",
    resource: "PostgreSQL",
    type: "System",
    details: "Automated nightly backup completed successfully",
  },
  {
    id: "LOG-006",
    timestamp: "2024-04-29 16:05:12",
    user: "manager@fms.com",
    action: "Deleted Report",
    resource: "Daily Reports",
    type: "Security",
    details: "User deleted report record from 2024-04-15",
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Security": return <ShieldCheck className="h-4 w-4 text-red-500" />;
    case "Data": return <Database className="h-4 w-4 text-blue-500" />;
    case "Export": return <FileDown className="h-4 w-4 text-green-500" />;
    case "System": return <Clock className="h-4 w-4 text-purple-500" />;
    default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
  }
};

export function AuditLogClient() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = DEMO_LOGS.filter(
    (log) =>
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4 items-center">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by action, user or resource..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Retention: 90 Days
          </Badge>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-muted/30 transition-colors text-xs">
                <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                  {log.timestamp}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(log.type)}
                    <span className="font-medium">{log.type}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{log.user}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-semibold text-[10px] uppercase tracking-wider">
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{log.resource}</TableCell>
                <TableCell className="max-w-xs truncate text-muted-foreground italic">
                  {log.details}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground italic">
          Audit logs are tamper-proof and cryptographically signed.
        </p>
      </div>
    </div>
  );
}
