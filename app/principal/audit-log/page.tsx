"use client"

import React, { useState, useMemo, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Search,
  ClipboardList,
  Filter,
  User,
  Hash,
  FileText,
  CalendarDays,
  RefreshCw,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { getAuditLogsAction } from "@/app/actions/audit-log"

type AuditLog = {
  id: string
  changeDescription: string
  changerName: string
  changerRole: string
  employeeNo: number
  fieldChanged: string
  oldValue: string
  newValue: string
  createdAt: Date
}

const FIELD_COLORS: Record<string, { bg: string; text: string; border: string; label: string }> = {
  name: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    label: "Name",
  },
  position: {
    bg: "bg-purple-100 dark:bg-purple-900/30",
    text: "text-purple-700 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
    label: "Position",
  },
  accWorkingDate: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    label: "ACC/Working Date",
  },
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function AuditLogPage() {
  const { data: session } = authClient.useSession()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [fieldFilter, setFieldFilter] = useState<string>("all")

  const userSection = useMemo(() => {
    const role = (session?.user as any)?.role as string
    if (!role) return null
    if (role === "principal_kg") return "KG"
    if (role === "principal_elementary") return "Elementary"
    if (role === "principal_middle" || role === "admin" || role === "manager") return "Middle School"
    if (role === "principal_high") return "High School"
    return null
  }, [session])

  const fetchLogs = async () => {
    setIsLoading(true)
    const result = await getAuditLogsAction(userSection || undefined)
    if (result.success && result.data) {
      setLogs(result.data as AuditLog[])
    }
    setIsLoading(false)
  }

  useEffect(() => {
    if (session) {
      fetchLogs()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, userSection])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.changeDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(log.employeeNo).includes(searchTerm)

      const matchesField = fieldFilter === "all" || log.fieldChanged === fieldFilter

      return matchesSearch && matchesField
    })
  }, [logs, searchTerm, fieldFilter])

  // Stats
  const stats = useMemo(() => {
    return {
      total: logs.length,
      nameChanges: logs.filter((l) => l.fieldChanged === "name").length,
      positionChanges: logs.filter((l) => l.fieldChanged === "position").length,
      dateChanges: logs.filter((l) => l.fieldChanged === "accWorkingDate").length,
    }
  }, [logs])

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ClipboardList className="h-7 w-7 text-primary" />
            </div>
            Audit Log
          </h2>
          <p className="text-muted-foreground mt-1.5">
            Track all payroll changes made by principals — {userSection || "All Sections"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchLogs}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Changes</p>
                <p className="text-2xl font-bold mt-1">{stats.total}</p>
              </div>
              <div className="p-2.5 rounded-full bg-primary/10">
                <Hash className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name Changes</p>
                <p className="text-2xl font-bold mt-1">{stats.nameChanges}</p>
              </div>
              <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-purple-500/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Position Changes</p>
                <p className="text-2xl font-bold mt-1">{stats.positionChanges}</p>
              </div>
              <div className="p-2.5 rounded-full bg-purple-100 dark:bg-purple-900/30">
                <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date Changes</p>
                <p className="text-2xl font-bold mt-1">{stats.dateChanges}</p>
              </div>
              <div className="p-2.5 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <CalendarDays className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="shadow-md overflow-hidden border-t-4 border-t-primary/20">
        <CardHeader className="bg-muted/30 border-b">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle>Change History</CardTitle>
              <CardDescription>
                {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              {/* Field Filter */}
              <div className="flex items-center gap-1.5 bg-background border rounded-md px-2 py-1">
                <Filter className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                <select
                  value={fieldFilter}
                  onChange={(e) => setFieldFilter(e.target.value)}
                  className="bg-transparent text-sm outline-none cursor-pointer pr-2 min-w-[100px]"
                >
                  <option value="all">All Fields</option>
                  <option value="name">Name</option>
                  <option value="position">Position</option>
                  <option value="accWorkingDate">ACC/Working Date</option>
                </select>
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search changes..."
                  className="w-full pl-9 bg-background"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-center border-r w-[70px]">
                    <span className="flex items-center justify-center gap-1">
                      <Hash className="h-3 w-3" /> ID
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold border-r">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3 w-3" /> Change Description
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold border-r w-[140px]">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" /> Date & Time
                    </span>
                  </TableHead>
                  <TableHead className="font-semibold border-r w-[100px] text-center">
                    Field
                  </TableHead>
                  <TableHead className="font-semibold w-[180px]">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> Changer
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading || !session ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-muted-foreground animate-pulse text-lg font-medium">
                          Loading audit history...
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    const fieldMeta = FIELD_COLORS[log.fieldChanged] || {
                      bg: "bg-gray-100 dark:bg-gray-800",
                      text: "text-gray-700 dark:text-gray-300",
                      border: "border-gray-200 dark:border-gray-700",
                      label: log.fieldChanged,
                    }
                    return (
                      <TableRow
                        key={log.id}
                        className={cn(
                          "transition-colors",
                          index % 2 === 0
                            ? "bg-background"
                            : "bg-muted/20"
                        )}
                      >
                        {/* Row Number */}
                        <TableCell className="text-center border-r font-mono text-sm font-semibold text-muted-foreground">
                          {index + 1}
                        </TableCell>

                        {/* Change Description */}
                        <TableCell className="border-r">
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                "w-1 h-full min-h-[20px] rounded-full flex-shrink-0 mt-0.5",
                                log.fieldChanged === "name" && "bg-blue-500",
                                log.fieldChanged === "position" && "bg-purple-500",
                                log.fieldChanged === "accWorkingDate" && "bg-amber-500"
                              )}
                            />
                            <span className="text-sm leading-relaxed">
                              {log.changeDescription}
                            </span>
                          </div>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="border-r">
                          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                            {formatDate(log.createdAt)}
                          </span>
                        </TableCell>

                        {/* Field Badge */}
                        <TableCell className="border-r text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-normal text-xs",
                              fieldMeta.bg,
                              fieldMeta.text,
                              fieldMeta.border
                            )}
                          >
                            {fieldMeta.label}
                          </Badge>
                        </TableCell>

                        {/* Changer */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/10">
                              <span className="text-xs font-bold text-primary">
                                {log.changerName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium leading-tight">
                                {log.changerName}
                              </span>
                              <span className="text-[10px] text-muted-foreground leading-tight">
                                {log.changerRole.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-48 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="p-4 rounded-full bg-muted/50">
                          <ClipboardList className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">
                            No audit records found
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {searchTerm || fieldFilter !== "all"
                              ? "Try adjusting your search or filter criteria"
                              : "Changes to payroll data will appear here automatically"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
