"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
  ShieldCheck,
  Landmark,
  GraduationCap,
  Building2,
  Users,
  ArrowRight,
  Loader2,
  Copy,
  Check,
  Database,
  LogOut,
  ExternalLink,
  BarChart3,
  Zap,
  Target,
  Layers,
  Cpu,
  MonitorPlay,
} from "lucide-react";

const ROLES = [
  {
    role: "student",
    label: "Student",
    email: "abebe@miliinum.com",
    password: "12345678",
    color: "from-blue-600 to-blue-700",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: GraduationCap,
    dashboardUrl: "/student/dashboard",
    tasks: ["Pay tuition via Chapa", "View payment history", "Access financial status"],
    demoStory: "Step 1: Start as a Student to generate initial revenue by paying tuition fees.",
  },
  {
    role: "accountant",
    label: "Accountant",
    email: "accountant@fms.demo",
    password: "Demo@1234",
    color: "from-blue-600 to-blue-700",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: Landmark,
    dashboardUrl: "/accountant",
    tasks: ["Manage Ledger & Invoices", "Record daily transactions", "Generate financial reports"],
    demoStory: "Step 2: Log in as the Accountant to verify the student's payment in the revenue dashboard.",
  },
  {
    role: "school_manager",
    label: "School Manager",
    email: "schoolmanager@fms.demo",
    password: "Demo@1234",
    color: "from-blue-600 to-blue-700",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: Users,
    dashboardUrl: "/school-manager",
    tasks: ["Manage facility operations", "Initiate purchase orders", "Operational financials"],
    demoStory: "Step 3: Switch to the School Manager to initiate a new purchase order using the collected funds.",
  },
  {
    role: "finance_head",
    label: "Finance Head",
    email: "financehead@fms.demo",
    password: "Demo@1234",
    color: "from-blue-600 to-blue-700",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: ShieldCheck,
    dashboardUrl: "/finance-head/dashboard",
    tasks: ["Review & approve payroll", "Authorize purchase orders", "Oversee budgeting"],
    demoStory: "Step 4: As the Finance Head, review and approve the pending purchase orders.",
  },
  {
    role: "principal",
    label: "Principal",
    email: "principal@fms.demo",
    password: "Demo@1234",
    color: "from-blue-600 to-blue-700",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    icon: Building2,
    dashboardUrl: "/principal",
    tasks: ["School-wide oversight", "Manage students", "Submit expense requests"],
    demoStory: "Step 5: Finally, the Principal has full oversight to review all activities and submit final expense requests.",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="ml-1 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function RoleCard({ r, onLoggedIn }: { r: typeof ROLES[0]; onLoggedIn: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const Icon = r.icon;

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error: err } = await authClient.signIn.email({ email: r.email, password: r.password });
    setLoading(false);
    if (err) {
      setError(err.message || "Login failed — seed accounts first.");
    } else {
      onLoggedIn();
    }
  };

  return (
    <div className={`rounded-3xl border ${r.border} ${r.bg} p-6 sm:p-8 flex flex-col gap-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group`}>
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${r.color} opacity-5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500`} />
      
      <div className="flex items-center gap-4">
        <div className={`bg-gradient-to-br ${r.color} p-4 rounded-2xl shadow-sm`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-xl">{r.label}</h3>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.badge}`}>{r.role}</span>
        </div>
      </div>

      <div className="bg-white/40 dark:bg-black/20 p-3 rounded-xl border border-black/5 dark:border-white/5">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-snug">{r.demoStory}</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Key Responsibilities</h4>
        <ul className="space-y-2">
          {r.tasks.map((task, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium">
              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <span>{task}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 px-4 py-3.5 space-y-2 mt-auto">
        <div className="flex items-center text-xs font-mono">
          <span className="text-muted-foreground w-14 shrink-0">Email:</span>
          <span className="font-semibold truncate">{r.email}</span>
          <CopyButton text={r.email} />
        </div>
        <div className="flex items-center text-xs font-mono">
          <span className="text-muted-foreground w-14 shrink-0">Pass:</span>
          <span className="font-semibold">{r.password}</span>
          <CopyButton text={r.password} />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-xl px-3 py-2 border border-red-200 dark:border-red-800">{error}</p>
      )}

      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-base font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-60 transition-all active:scale-95"
      >
        {loading
          ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing in…</>
          : <>Login as {r.label} <ArrowRight className="h-5 w-5" /></>
        }
      </button>
    </div>
  );
}

function ActiveRolePanel({ roleData, onLogout }: { roleData: typeof ROLES[0]; onLogout: () => void }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const Icon = roleData.icon;

  const handleLogout = async () => {
    setLoggingOut(true);
    await authClient.signOut();
    onLogout();
    setLoggingOut(false);
  };

  return (
    <div className={`rounded-3xl border ${roleData.border} ${roleData.bg} p-8 lg:p-10 shadow-lg relative overflow-hidden`}>
      <div className={`absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br ${roleData.color} opacity-5 rounded-full blur-3xl pointer-events-none`} />
      
      <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start relative z-10">
        <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
          <div className={`bg-gradient-to-br ${roleData.color} p-5 rounded-3xl shadow-md shrink-0`}>
            <Icon className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Logged in as</p>
            <h2 className="text-4xl font-black tracking-tight">{roleData.label}</h2>
            <p className="text-base text-muted-foreground font-mono">{roleData.email}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <a
            href={roleData.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 shadow transition-all active:scale-95"
          >
            Open Dashboard
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-700 text-sm font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 shadow-sm"
          >
            {loggingOut
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging out…</>
              : <><LogOut className="h-4 w-4" /> Switch Role</>
            }
          </button>
        </div>
      </div>

      <div className="mt-10 pt-8 border-t border-black/10 dark:border-white/10 grid md:grid-cols-2 gap-8 relative z-10">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Demo Story Context</h3>
          <div className="bg-white/50 dark:bg-black/20 p-5 rounded-2xl border border-black/5 dark:border-white/5">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
              {roleData.demoStory}
            </p>
          </div>
        </div>
        
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Your Tasks</h3>
          <div className="space-y-3">
            {roleData.tasks.map((task, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/50 dark:bg-black/20 p-4 rounded-xl border border-black/5 dark:border-white/5">
                <Check className={`h-5 w-5 text-green-500 shrink-0 mt-0.5`} />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{task}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PresentationPage() {
  const [session, setSession] = useState<{ role: string; email: string } | null | "loading">("loading");
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [seedError, setSeedError] = useState("");
  const [seedLog, setSeedLog] = useState<string[]>([]);

  const loadSession = async () => {
    const s = await authClient.getSession();
    if (s?.data?.user) {
      setSession({ role: s.data.user.role as string, email: s.data.user.email });
    } else {
      setSession(null);
    }
  };

  useEffect(() => { loadSession(); }, []);

  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedError("");
    setSeedLog([]);
    try {
      const res = await fetch("/api/demo-seed", { method: "POST" });
      const data = await res.json();
      if (data.success) { setSeedDone(true); setSeedLog(data.log || []); }
      else { setSeedError(data.error || "Seeding failed"); setSeedLog(data.log || []); }
    } catch (e: any) { setSeedError(e.message); }
    setSeedLoading(false);
  };

  const activeRole = session && session !== "loading"
    ? ROLES.find((r) => r.role === session.role) ?? null
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="border-b bg-white dark:bg-slate-900 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl shadow">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-bold text-base">Finance Management System</h1>
          </div>
          <div className="flex items-center gap-2 text-xs bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 px-3 py-1.5 rounded-full">
            <Zap className="h-3 w-3 text-yellow-500" />
            <span className="font-semibold text-yellow-700 dark:text-yellow-400">Demo</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {session === "loading" ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activeRole ? (
          <ActiveRolePanel roleData={activeRole} onLogout={() => setSession(null)} />
        ) : (
          <>
            {/* Presentation Content */}
            <div className="space-y-16 pb-12 border-b border-slate-200 dark:border-slate-800">
              
              <div className="text-center space-y-5 max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                  School Finance Management
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground font-medium">
                  A unified platform to streamline school operations, from automated fee collection to role-based workflows and real-time ledger accounting.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-3xl p-8 hover:shadow-lg transition-shadow">
                  <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-6 flex items-center gap-3">
                    <Target className="h-7 w-7" /> The Problem
                  </h2>
                  <ul className="space-y-4 text-red-900/80 dark:text-red-300/80 font-medium">
                    <li className="flex gap-3"><span className="font-bold text-red-500">•</span> Manual, paper-based fee collection and expense tracking.</li>
                    <li className="flex gap-3"><span className="font-bold text-red-500">•</span> Disconnected roles causing bottlenecks in approval workflows.</li>
                    <li className="flex gap-3"><span className="font-bold text-red-500">•</span> Lack of real-time visibility into the school's financial health.</li>
                    <li className="flex gap-3"><span className="font-bold text-red-500">•</span> High risk of errors in payroll and manual ledger management.</li>
                  </ul>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-3xl p-8 hover:shadow-lg transition-shadow">
                  <h2 className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mb-6 flex items-center gap-3">
                    <Check className="h-7 w-7" /> The Solution
                  </h2>
                  <ul className="space-y-4 text-emerald-900/80 dark:text-emerald-300/80 font-medium">
                    <li className="flex gap-3"><span className="font-bold text-emerald-500">•</span> <strong>Unified Platform:</strong> One central system for all financial operations.</li>
                    <li className="flex gap-3"><span className="font-bold text-emerald-500">•</span> <strong>Role-Based Workflows:</strong> Streamlined approvals with structured access.</li>
                    <li className="flex gap-3"><span className="font-bold text-emerald-500">•</span> <strong>Automated Payments:</strong> Integrated Chapa payments for tuition and payroll.</li>
                    <li className="flex gap-3"><span className="font-bold text-emerald-500">•</span> <strong>Real-time Analytics:</strong> Instant visibility into revenue, expenses, and cash flow.</li>
                  </ul>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                  <Layers className="w-64 h-64" />
                </div>
                <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
                  <Zap className="h-8 w-8 text-yellow-500" /> System Features
                </h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 relative z-10">
                  {[
                    { title: "Role-Based Access", desc: "Granular permissions for 5 distinct school roles ensuring data security." },
                    { title: "Chapa Integration", desc: "Seamless digital payments for students and automated staff payroll." },
                    { title: "Approval Workflows", desc: "Multi-step transparent approvals for purchase orders and expenses." },
                    { title: "Audit Logging", desc: "Track every financial change for complete compliance and transparency." },
                    { title: "Real-time Ledger", desc: "Automated double-entry accounting ledger updates on every transaction." },
                    { title: "Responsive Design", desc: "Mobile-first, fluid experience for managing tasks on the go." },
                  ].map((f, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">{f.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-3xl p-8 hover:shadow-lg transition-shadow">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Database className="h-7 w-7 text-blue-500" /> Architecture & Design
                  </h2>
                  <ul className="space-y-4 text-slate-600 dark:text-slate-400 font-medium">
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" /><strong>Frontend:</strong> Next.js 14 (App Router), React, Tailwind CSS.</li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" /><strong>Backend:</strong> Next.js Server Actions & API Routes.</li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" /><strong>Database:</strong> PostgreSQL with Drizzle ORM.</li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" /><strong>Auth:</strong> Better-Auth for secure session management.</li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" /><strong>Payments:</strong> Chapa API Integration.</li>
                  </ul>
                </div>

                <div className="bg-slate-100 dark:bg-slate-800/50 rounded-3xl p-8 hover:shadow-lg transition-shadow">
                  <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Cpu className="h-7 w-7 text-violet-500" /> Implementation Details
                  </h2>
                  <ul className="space-y-4 text-slate-600 dark:text-slate-400 font-medium">
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-violet-500 shrink-0" /><strong>Type Safety:</strong> End-to-end TypeScript integration.</li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-violet-500 shrink-0" /><strong>Security:</strong> Protected routes, robust server validation.</li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-violet-500 shrink-0" /><strong>Scalability:</strong> Serverless architecture ready for high traffic.</li>
                    <li className="flex items-start gap-2"><div className="w-2 h-2 mt-2 rounded-full bg-violet-500 shrink-0" /><strong>UX:</strong> Optimistic UI updates, instant feedback.</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-center space-y-4 pb-4">
              <h2 className="text-4xl font-black flex items-center justify-center gap-3">
                <MonitorPlay className="h-8 w-8 text-blue-500" /> Live Demo
              </h2>
              <p className="text-lg text-muted-foreground font-medium">
                Choose a role below to explore the application from their specific viewpoint.
              </p>
            </div>

            {/* Seed */}
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
              <div>
                <p className="font-bold text-lg">Create demo accounts</p>
                <p className="text-sm text-muted-foreground mt-1 font-medium">Run once to prepare the environment for the demo — safe to run multiple times.</p>
              </div>
              <button
                onClick={handleSeed}
                disabled={seedLoading || seedDone}
                className="shrink-0 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-bold px-6 py-3 rounded-xl flex items-center gap-2 hover:opacity-80 disabled:opacity-50 transition-all active:scale-95 shadow-md"
              >
                {seedLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>
                  : seedDone ? <><Check className="h-4 w-4 text-green-500" /> Demo Ready</>
                  : <><Database className="h-4 w-4" /> Initialize Demo Accounts</>}
              </button>
              {seedError && <p className="w-full text-sm font-bold text-red-500 mt-2">{seedError}</p>}
              {seedLog.length > 0 && (
                <div className="w-full space-y-1 mt-3 bg-slate-100 dark:bg-slate-800 p-3 rounded-xl">
                  {seedLog.map((l, i) => <p key={i} className="text-xs font-mono text-slate-600 dark:text-slate-400">{l}</p>)}
                </div>
              )}
            </div>

            {/* Role Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ROLES.map((r) => (
                <RoleCard key={r.role} r={r} onLoggedIn={loadSession} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
