'use client';
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@/components/admin-kit/shim/router";
import { format } from "date-fns";
import {
  AreaChart, Area,
  XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid,
} from "recharts";
import { AXIS_TICK_SM, CHART_COLORS, ChartEmpty, ChartFrame, GRID_PROPS, areaFade, NO_TWEEN } from "@/lib/charts";
import { RefreshCw, AlertTriangle, ArrowRight, Info, Calculator } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/admin-kit/_deps/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/admin-kit/_deps/components/ui/dialog";
import { PageHeader } from "../components/PageHeader";
import { DataTable } from "../components/DataTable";
import { TransactionDetailDrawer, type ChargeLike } from "../components/TransactionDetailDrawer";
import { useAdminMetrics } from "../lib/queries";
import { PLANS, annualPerMonth, formatUsd, planByTier } from "@/lib/pricing";
import { callEdgeFn } from "../lib/api";
import { formatCurrency, formatNumber, formatPct } from "../lib/formatters";
import { useDateRange } from "../contexts/DateRangeContext";
import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Skeleton } from "@/components/admin-kit/_deps/components/ui/skeleton";

/* ─── Stripe types ─── */
interface StripeCustomerExpanded {
  id: string;
  email: string | null;
  name: string | null;
}
interface StripeCharge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created: number;
  description: string | null;
  receipt_email: string | null;
  customer: StripeCustomerExpanded | string | null;
  billing_details?: { email: string | null; name: string | null };
  refunded: boolean;
  disputed: boolean;
  metadata?: Record<string, string>;
  receipt_url?: string | null;
  failure_code?: string | null;
  failure_message?: string | null;
  outcome?: { type?: string; reason?: string | null; seller_message?: string | null; network_status?: string | null } | null;
  payment_method_details?: { type?: string; card?: { brand?: string; last4?: string; funding?: string; country?: string } } | null;
}
interface StripeChargesResponse {
  data: StripeCharge[];
  has_more: boolean;
}
interface StripeSyncResult {
  synced: number;
  users_updated: number;
  details: Array<{ stripe_id: string; customer_id: string; user_id: string | null; action: string }>;
}
interface StripeBalanceAmount { amount: number; currency: string }
interface StripeBalance {
  available: StripeBalanceAmount[];
  pending: StripeBalanceAmount[];
}

/* ─── Helpers ─── */

function getChargeEmail(c: StripeCharge): string {
  const expanded = typeof c.customer === "object" && c.customer !== null ? c.customer.email : null;
  return expanded ?? c.receipt_email ?? c.billing_details?.email ?? "-";
}

function groupChargesByDay(charges: StripeCharge[]): Array<{ day: string; revenue: number }> {
  const totals: Record<string, number> = {};
  for (const c of charges) {
    if (c.status !== "succeeded" || c.refunded) continue;
    const day = format(new Date(c.created * 1000), "MMM d");
    totals[day] = (totals[day] ?? 0) + c.amount / 100;
  }
  return Object.entries(totals)
    .map(([day, revenue]) => ({ day, revenue: Math.round(revenue * 100) / 100 }));
}

const statusBadge: Record<string, string> = {
  succeeded: "bg-success-bg text-success-text",
  pending:   "bg-warning-bg text-warning-text",
  failed:    "bg-error-bg text-error-text",
  refunded:  "bg-warning-bg text-warning-text",
};

function buildColumns(charges: StripeCharge[]): ColumnDef<StripeCharge, unknown>[] {
  const emailCounts: Record<string, number> = {};
  for (const c of charges) {
    const e = getChargeEmail(c);
    if (e !== "-") emailCounts[e] = (emailCounts[e] ?? 0) + 1;
  }
  return [
    {
      header: "Customer",
      id: "customer",
      accessorFn: (row) => getChargeEmail(row),
      cell: ({ row }) => {
        const email = getChargeEmail(row.original);
        const count = email !== "-" ? (emailCounts[email] ?? 1) : 1;
        const initials = email !== "-" ? email.slice(0, 2).toUpperCase() : "?";
        return (
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-full bg-brand-wash border border-brand/30 flex items-center justify-center text-xs font-bold text-brand-deep">
              {initials}
            </div>
            <span className="truncate text-sm text-ink-strong">{email}</span>
            {row.original.metadata?.label === "test" && (
              <span className="rounded-full bg-surface-sunken border border-glass-hairline px-1.5 py-0.5 text-[10px] font-medium text-ink-soft shrink-0">
                test
              </span>
            )}
            {count > 1 && (
              <span className="rounded-full bg-warning-bg px-1.5 py-0.5 text-[10px] font-semibold text-warning-text shrink-0">
                ×{count}
              </span>
            )}
          </div>
        );
      },
      enableSorting: false,
    },
    {
      header: "Date",
      id: "date",
      accessorFn: (row) => row.created,
      cell: ({ row }) => (
        <span className="text-sm text-ink-soft">
          {format(new Date(row.original.created * 1000), "MMM d, yyyy")}
        </span>
      ),
      enableSorting: false,
    },
    {
      header: "Amount",
      id: "amount",
      accessorFn: (row) => row.amount,
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-ink-strong tabular-nums">
          {formatCurrency(row.original.amount / 100)}
        </span>
      ),
    },
    {
      header: "Status",
      id: "status",
      accessorFn: (row) => row.status,
      cell: ({ row }) => {
        const s = row.original.refunded ? "refunded" : row.original.status;
        return (
          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusBadge[s] ?? "bg-surface-sunken text-ink-soft")}>
            {s}
          </span>
        );
      },
    },
  ];
}

/* ─── Compact KPI tile ─── */
function KpiCard({
  label,
  value,
  sub,
  loading,
  highlight,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
  highlight?: "emerald" | "red";
  tooltip?: string;
}) {
  if (loading) return (
    <div className="glass-card rounded-card border border-glass-hairline shadow-contact p-3.5">
      <Skeleton className="h-3 w-16 bg-surface-sunken mb-2.5" />
      <Skeleton className="h-6 w-20 bg-surface-sunken" />
    </div>
  );
  return (
    <div className={cn(
      "rounded-xl border bg-surface p-3.5",
      highlight === "emerald" ? "border-success-border" :
      highlight === "red"     ? "border-error-border"     :
      "border-glass-hairline"
    )}>
      <div className="flex items-center gap-1 mb-1.5">
        <p className="text-[11px] text-ink-soft uppercase tracking-wider truncate">{label}</p>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-ink-faint hover:text-ink-soft shrink-0 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] text-xs leading-snug">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <p className={cn(
        "text-xl font-bold tabular-nums leading-none",
        highlight === "emerald" ? "text-success-text" :
        highlight === "red"     ? "text-error-text"     :
        "text-ink-strong"
      )}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-ink-faint truncate">{sub}</p>}
    </div>
  );
}

/* ─── Chart tooltip ─── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-card border border-glass-hairline bg-surface-sunken px-3 py-2 shadow-2xl">
      <p className="text-xs text-ink-soft mb-0.5">{label}</p>
      <p className="text-sm font-bold text-ink-strong">{formatCurrency(payload[0].value)}</p>
    </div>
  );
}

/* ─── Page ─── */
/* ─── By-platform breakdown (signups / paid / est. revenue + funnel) ─── */
interface PlatformRow { platform: string; signups: number; paidCustomers: number; conversionPct: number; estMrr: number }
interface FunnelByPlatform { platform: string; steps: { step: string; sessions: number }[] }
interface PlatformBreakdownResponse { byPlatform: PlatformRow[]; funnelByPlatform: FunnelByPlatform[] }

const PLATFORM_LABEL: Record<string, string> = { web: "Web (Stripe)", ios: "iOS", android: "Android", unknown: "Unknown" };

function PlatformBreakdown() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "platform-breakdown"],
    queryFn: () => callEdgeFn<PlatformBreakdownResponse>("admin-platform-breakdown", {}),
    staleTime: 60_000,
  });
  const rows = data?.byPlatform ?? [];

  return (
    <div className="rounded-2xl border border-glass-hairline bg-surface p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-ink-strong">By platform</p>
        <p className="text-xs text-ink-soft">Signups, paid customers, conversion and estimated MRR by signup platform. Revenue is estimated from plan price (web = Stripe; iOS/Android = RevenueCat, not in the charges table).</p>
      </div>
      {isLoading ? (
        <p className="text-sm text-ink-faint py-4">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-ink-faint py-4">No signup-platform data yet.</p>
      ) : (
        <div className="divide-y divide-glass-hairline">
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 pb-2 text-[11px] uppercase tracking-wider text-ink-faint">
            <span>Platform</span>
            <span className="w-16 text-right">Signups</span>
            <span className="w-14 text-right">Paid</span>
            <span className="w-16 text-right">Conv.</span>
            <span className="w-20 text-right">Est. MRR</span>
          </div>
          {rows.map((r) => (
            <div key={r.platform} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 py-2.5 text-sm">
              <span className="text-ink-strong">{PLATFORM_LABEL[r.platform] ?? r.platform}</span>
              <span className="w-16 text-right tabular-nums text-ink-body">{formatNumber(r.signups)}</span>
              <span className="w-14 text-right tabular-nums text-ink-body">{formatNumber(r.paidCustomers)}</span>
              <span className="w-16 text-right tabular-nums text-ink-soft">{r.conversionPct}%</span>
              <span className="w-20 text-right tabular-nums text-success-text">{formatCurrency(r.estMrr)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Conversion funnel by platform */}
      {(data?.funnelByPlatform?.length ?? 0) > 0 && (
        <div className="mt-6">
          <p className="text-xs text-ink-soft uppercase tracking-wider mb-2">Purchase funnel by platform (sessions)</p>
          <div className="space-y-3">
            {data!.funnelByPlatform.map((f) => {
              const top = f.steps[0]?.sessions || 1;
              return (
                <div key={f.platform}>
                  <p className="text-xs text-ink-soft mb-1">{PLATFORM_LABEL[f.platform] ?? f.platform}</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {f.steps.map((s) => (
                      <div key={s.step} className="rounded-md bg-surface-sunken border border-glass-hairline px-2 py-1.5">
                        <p className="text-[10px] text-ink-soft truncate">{s.step.replace("premium_", "").replace("_", " ")}</p>
                        <p className="text-sm text-ink-strong tabular-nums">{formatNumber(s.sessions)}</p>
                        <div className="mt-1 h-1 rounded-full bg-surface-sunken overflow-hidden">
                          <div className="h-full bg-brand/60" style={{ width: `${Math.min(100, (s.sessions / top) * 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Profitability breakdown modal ─── */
/* Plan prices are DISPLAY values re-exported from the one pricing module
   (src/lib/pricing.ts); Stripe is the source of truth for what is charged.
   These used to be typed out here AND in ProfitCalculatorPage AND in
   UserDetailDrawer, which is how the three pages ended up quoting different
   prices for the same plan. */
// Kyriq sells THREE tiers, so there is no single "the plan price". These used
// to be DepthMe's $14.99 / $99.99, which made every figure in this modal wrong
// by roughly 17x. The per-plan margin rows below are an illustration, not a
// measurement: they are computed for Professional, the middle and most popular
// tier, because the subscriber-to-tier mix is not recorded anywhere this page
// can read. The headline MRR figures above come from real data and are not
// affected by this choice.
const REFERENCE_PLAN = planByTier('professional');
const MONTHLY_PLAN_PRICE = REFERENCE_PLAN.monthly;
const ANNUAL_PLAN_PRICE = REFERENCE_PLAN.annual;
const STRIPE_PCT_MODAL = 0.029;
const STRIPE_FLAT_MODAL = 0.30;

function ProfitBreakdownModal({
  open,
  onClose,
  metrics,
}: {
  open: boolean;
  onClose: () => void;
  metrics: import("../lib/queries").AdminMetrics | undefined;
}) {
  if (!metrics) {
    return (
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Profitability breakdown</DialogTitle>
            <DialogDescription>Loading live numbers…</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const totalUsers = metrics.totalUsers;
  const freeUsers = Math.max(0, totalUsers - metrics.premiumUsers);
  const monthlyCount = metrics.activeMonthlySubs;
  const yearlyCount = metrics.activeYearlySubs;
  const grantedCount = metrics.grantedUsers;

  // ponytail: OCR provider spend (Gemini, OpenAI fallback) is not tracked in Kyriq's DB,
  // so costs here are Stripe fees only. Wire a cost table in when one exists.
  const aiCostTotal = 0;
  const costPerUser = totalUsers > 0 ? aiCostTotal / totalUsers : 0;

  const mrrUsdModal = metrics.mrrCents / 100;
  // Rough monthly Stripe fee estimate: % + flat fee per monthly-billed sub.
  // Annual subs are charged once/year, so their monthly-equivalent flat-fee share is negligible here.
  const estMonthlyStripeFees = mrrUsdModal * STRIPE_PCT_MODAL + STRIPE_FLAT_MODAL * monthlyCount;
  const totalMonthlyCosts = aiCostTotal + estMonthlyStripeFees;
  const netProfit = mrrUsdModal - totalMonthlyCosts;
  const marginPct = mrrUsdModal > 0 ? (netProfit / mrrUsdModal) * 100 : 0;
  const isProfitable = netProfit > 0;

  const monthlyPlanMargin = MONTHLY_PLAN_PRICE * (1 - STRIPE_PCT_MODAL) - STRIPE_FLAT_MODAL - costPerUser;
  const annualPlanMonthlyEquivalent = annualPerMonth(REFERENCE_PLAN);
  const annualPlanMargin = annualPlanMonthlyEquivalent - costPerUser; // annual flat fee amortized negligibly per month

  const now = new Date();
  const monthLabel = now.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profitability breakdown, {monthLabel}</DialogTitle>
          <DialogDescription>Are we making a profit, and what does each plan earn after fees?</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Verdict banner */}
          <div className={cn(
            "rounded-xl border px-4 py-3 text-sm font-medium",
            isProfitable ? "border-success-border bg-success-bg text-success-text"
                         : "border-error-border bg-error-bg text-error-text"
          )}>
            {isProfitable
              ? `Profitable, an estimated ${formatCurrency(netProfit)}/mo net (${formatPct(marginPct)} margin) after Stripe fees.`
              : `Not profitable right now, an estimated ${formatCurrency(Math.abs(netProfit))}/mo shortfall after Stripe fees.`}
          </div>

          {/* User split */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-soft mb-2">Users, {formatNumber(totalUsers)} total</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-glass-hairline bg-surface-sunken p-3">
                <p className="text-[11px] text-ink-soft">Free</p>
                <p className="text-lg font-bold text-ink-strong tabular-nums">{formatNumber(freeUsers)}</p>
              </div>
              <div className="rounded-lg border border-glass-hairline bg-surface-sunken p-3">
                <p className="text-[11px] text-ink-soft">Paid (monthly)</p>
                <p className="text-lg font-bold text-ink-strong tabular-nums">{formatNumber(monthlyCount)}</p>
              </div>
              <div className="rounded-lg border border-glass-hairline bg-surface-sunken p-3">
                <p className="text-[11px] text-ink-soft">Paid (annual)</p>
                <p className="text-lg font-bold text-ink-strong tabular-nums">{formatNumber(yearlyCount)}</p>
              </div>
              <div className="rounded-lg border border-glass-hairline bg-surface-sunken p-3">
                <p className="text-[11px] text-ink-soft">Comped firms</p>
                <p className="text-lg font-bold text-ink-strong tabular-nums">{formatNumber(grantedCount)}</p>
              </div>
            </div>
          </div>

          {/* Costs */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-soft mb-2">Costs (est. per month)</p>
            <div className="rounded-lg border border-glass-hairline bg-surface-sunken divide-y divide-glass-hairline">
              <div className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-ink-soft">Est. Stripe fees /mo</span>
                <span className="text-ink-strong tabular-nums">{formatCurrency(estMonthlyStripeFees)}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2.5 text-sm bg-surface-sunken">
                <span className="font-semibold text-ink-body">Total costs /mo</span>
                <span className="font-bold text-ink-strong tabular-nums">{formatCurrency(totalMonthlyCosts)}</span>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-ink-faint">OCR provider and hosting costs aren't tracked here, see the Profit Calculator for scenario modeling.</p>
          </div>

          {/* Revenue vs cost */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-soft mb-2">Revenue vs. cost</p>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-lg border border-glass-hairline bg-surface-sunken p-3">
                <p className="text-[11px] text-ink-soft">MRR</p>
                <p className="text-base font-bold text-ink-strong tabular-nums">{formatCurrency(mrrUsdModal)}</p>
              </div>
              <div className="rounded-lg border border-glass-hairline bg-surface-sunken p-3">
                <p className="text-[11px] text-ink-soft">Total costs</p>
                <p className="text-base font-bold text-ink-strong tabular-nums">{formatCurrency(totalMonthlyCosts)}</p>
              </div>
              <div className={cn("rounded-lg border p-3", isProfitable ? "border-success-border bg-success-bg" : "border-error-border bg-error-bg")}>
                <p className="text-[11px] text-ink-soft">Net profit</p>
                <p className={cn("text-base font-bold tabular-nums", isProfitable ? "text-success-text" : "text-error-text")}>{formatCurrency(netProfit)}</p>
              </div>
            </div>
          </div>

          {/* Per-plan profitability */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-ink-soft mb-2">Per-plan margin (after Stripe fees)</p>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg border border-glass-hairline bg-surface-sunken p-3">
                <p className="text-[11px] text-ink-soft">{REFERENCE_PLAN.name} monthly ({formatUsd(MONTHLY_PLAN_PRICE)})</p>
                <p className={cn("text-base font-bold tabular-nums", monthlyPlanMargin >= 0 ? "text-success-text" : "text-error-text")}>{formatCurrency(monthlyPlanMargin)}/mo</p>
              </div>
              <div className="rounded-lg border border-glass-hairline bg-surface-sunken p-3">
                <p className="text-[11px] text-ink-soft">{REFERENCE_PLAN.name} annual ({formatUsd(ANNUAL_PLAN_PRICE)}/yr)</p>
                <p className={cn("text-base font-bold tabular-nums", annualPlanMargin >= 0 ? "text-success-text" : "text-error-text")}>{formatCurrency(annualPlanMargin)}/mo-equiv</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function RevenuePage() {
  const { data: metrics, isLoading: metricsLoading } = useAdminMetrics();
  const dateRange = useDateRange();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [selectedCharge, setSelectedCharge] = useState<StripeCharge | null>(null);
  const [showProfitBreakdown, setShowProfitBreakdown] = useState(false);

  async function handleStripeSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await callEdgeFn<StripeSyncResult>("admin-stripe-sync", {});
      setSyncResult(
        result.users_updated > 0
          ? `✓ Synced ${result.synced} sub${result.synced !== 1 ? "s" : ""}, activated ${result.users_updated} user${result.users_updated !== 1 ? "s" : ""}`
          : `✓ ${result.synced} sub${result.synced !== 1 ? "s" : ""} up to date`
      );
      queryClient.invalidateQueries({ queryKey: ["admin", "metrics"] });
    } catch {
      setSyncResult("✗ Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  const chargesQuery = useQuery({
    queryKey: ["admin", "stripe", "charges", dateRange.from, dateRange.to],
    queryFn: () => callEdgeFn<StripeChargesResponse>("admin-stripe-query", { resource: "charges", limit: 20 }),
    staleTime: 60_000,
  });

  const balanceQuery = useQuery({
    queryKey: ["admin", "stripe", "balance"],
    queryFn: () => callEdgeFn<StripeBalance>("admin-stripe-query", { resource: "balance" }),
    staleTime: 60_000,
  });

  const payoutsQuery = useQuery({
    queryKey: ["admin", "stripe", "payouts"],
    queryFn: () => callEdgeFn<{ data: Array<{ amount: number; status: string; currency: string }> }>(
      "admin-stripe-query", { resource: "payouts", limit: 100 }
    ),
    staleTime: 120_000,
  });


  const charges = chargesQuery.data?.data ?? [];
  const columns = buildColumns(charges);
  const chartData = groupChargesByDay(charges);

  const succeededCharges = charges.filter((c) => c.status === "succeeded" && !c.refunded);
  const totalCollected = succeededCharges.reduce((s, c) => s + c.amount / 100, 0);
  const uniqueEmails = new Set(succeededCharges.map(getChargeEmail).filter((e) => e !== "-")).size;
  const arpu = uniqueEmails > 0 ? totalCollected / uniqueEmails : 0;
  const avgTx = succeededCharges.length > 0 ? totalCollected / succeededCharges.length : 0;

  const paidToBankUsd = payoutsQuery.data
    ? payoutsQuery.data.data
        .filter((p) => p.status === "paid" && p.currency === "usd")
        .reduce((s, p) => s + p.amount / 100, 0)
    : null;

  const availableBalanceUsd = balanceQuery.data
    ? (balanceQuery.data.available.find((b) => b.currency === "usd")?.amount ?? 0) / 100
    : null;
  const pendingBalanceUsd = balanceQuery.data
    ? (balanceQuery.data.pending.find((b) => b.currency === "usd")?.amount ?? 0) / 100
    : null;

  const mrrUsd = metrics ? metrics.mrrCents / 100 : 0;
  // Conversion uses deduped paying customers (by email), not raw is_premium rows.
  const conversionPct = metrics && metrics.totalUsers > 0
    ? (metrics.paidCustomers / metrics.totalUsers) * 100
    : 0;

  const duplicates = metrics?.duplicateSubscriptions ?? [];

  /* ── Revenue breakdown maths ── */
  // Stripe standard pricing (2.9% + $0.30 per successful charge).
  const STRIPE_PCT = 0.029;
  const STRIPE_FLAT = 0.30;
  const estFees = totalCollected > 0 ? totalCollected * STRIPE_PCT + STRIPE_FLAT * succeededCharges.length : 0;
  const netCollected = totalCollected - estFees;

  // New vs returning customers by succeeded charges within the period.
  const emailChargeCounts: Record<string, number> = {};
  for (const c of succeededCharges) {
    const e = getChargeEmail(c);
    if (e !== "-") emailChargeCounts[e] = (emailChargeCounts[e] ?? 0) + 1;
  }
  const returningCustomers = Object.values(emailChargeCounts).filter((n) => n > 1).length;
  const newCustomers = Object.values(emailChargeCounts).filter((n) => n === 1).length;

  // MRR split by plan (monthly vs annual-normalised).
  const monthlyMrr = metrics ? metrics.mrrMonthlyCents / 100 : 0;
  const yearlyMrr = metrics ? metrics.mrrYearlyCents / 100 : 0;
  const mrrTotal = monthlyMrr + yearlyMrr;
  const monthlyShare = mrrTotal > 0 ? (monthlyMrr / mrrTotal) * 100 : 0;
  const yearlyShare = mrrTotal > 0 ? (yearlyMrr / mrrTotal) * 100 : 0;

  // Plain-language "is revenue being generated accordingly?" verdict.
  const paying = metrics?.paidCustomers ?? 0;
  const healthOk = mrrUsd > 0 && paying > 0;
  const healthVerdict = !metrics
    ? ""
    : mrrUsd <= 0
      ? "No active recurring revenue yet, focus on converting trials and signups to paid plans."
      : `Revenue is being generated: ${formatCurrency(mrrUsd)} MRR (${formatCurrency(metrics.arrCents / 100)} ARR) from ${paying} paying customer${paying !== 1 ? "s" : ""}.${duplicates.length > 0 ? " ⚠ Duplicate billing is inflating totals, resolve it above." : ""}`;

  return (
    <TooltipProvider delayDuration={300}>
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Revenue" description="Subscriptions, transactions, and financial health" />
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfitBreakdown(true)}
              className="flex items-center gap-1.5 rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-1.5 text-xs text-ink-soft hover:text-ink-strong hover:bg-surface-sunken transition-colors"
            >
              <Calculator className="h-3 w-3" />
              Profitability breakdown
            </button>
            <button
              onClick={handleStripeSync}
              disabled={syncing}
              className="flex items-center gap-1.5 rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-1.5 text-xs text-ink-soft hover:text-ink-strong hover:bg-surface-sunken transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
              {syncing ? "Syncing…" : "Sync from Stripe"}
            </button>
          </div>
          {syncResult && (
            <p className={cn("text-xs", syncResult.startsWith("✓") ? "text-success-text" : "text-error-text")}>
              {syncResult}
            </p>
          )}
        </div>
      </div>

      {/* Duplicate billing warning */}
      {duplicates.length > 0 && (
        <div className="rounded-xl border border-warning-border bg-warning-bg px-4 py-2.5 flex items-start gap-3">
          <AlertTriangle className="h-3.5 w-3.5 text-warning-text mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-warning-text">Duplicate billing detected</p>
            {duplicates.map((d) => (
              <p key={d.email} className="text-xs text-warning-text/80 mt-0.5">
                <span className="font-medium">{d.email}</span>, {d.count} active subscriptions, charged {d.count}×/month
              </p>
            ))}
          </div>
          <a href="https://dashboard.stripe.com/subscriptions" target="_blank" rel="noopener noreferrer"
             className="shrink-0 text-xs text-warning-text underline underline-offset-2 hover:text-warning-text">
            Stripe →
          </a>
        </div>
      )}

      {/* ── Top 6 KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Collected"  value={chargesQuery.data ? formatCurrency(totalCollected) : "-"} sub="this period"         loading={chargesQuery.isLoading} tooltip="Sum of all succeeded charges in the selected date period. Does not include refunded or failed charges." />
        <KpiCard label="MRR"              value={metrics ? formatCurrency(mrrUsd) : "-"}                  sub="monthly recurring"   loading={metricsLoading}         tooltip="Monthly Recurring Revenue, sum of all active monthly subscription amounts billed per month." />
        <KpiCard label="ARR"              value={metrics ? formatCurrency(metrics.arrCents / 100) : "-"}  sub="annual recurring"    loading={metricsLoading}         tooltip="Annual Recurring Revenue, sum of all active annual subscription amounts billed per year." />
        <KpiCard label="Active Subs"      value={metrics ? formatNumber(metrics.activeSubsCount) : "-"}   sub="live subscriptions"  loading={metricsLoading}         tooltip="Number of live Stripe subscriptions right now, regardless of plan type." />
        <KpiCard label="Unique Customers" value={metrics ? formatNumber(metrics.uniquePayingCustomers) : "-"} sub="paying customers" loading={metricsLoading}        tooltip="Distinct paying customers with at least one active subscription. A customer with two subs counts once." />
        <KpiCard label="ARPU"             value={chargesQuery.data ? formatCurrency(arpu) : "-"}          sub="avg revenue / user"  loading={chargesQuery.isLoading} tooltip="Average Revenue Per User, Total Collected divided by the number of unique paying email addresses." />
      </div>

      {/* ── Stripe balance strip ── */}
      <div className="grid grid-cols-3 gap-3">
        <KpiCard
          label="Available Balance"
          value={availableBalanceUsd !== null ? formatCurrency(availableBalanceUsd) : "-"}
          sub="ready for payout"
          loading={balanceQuery.isLoading}
          highlight={availableBalanceUsd !== null && availableBalanceUsd < 0 ? "red" : "emerald"}
          tooltip="Cash sitting in Stripe ready for the next bank payout. Goes negative when refunds exceed incoming funds, the deficit is deducted from your next payout automatically."
        />
        <KpiCard
          label="Pending Balance"
          value={pendingBalanceUsd !== null ? formatCurrency(pendingBalanceUsd) : "-"}
          sub="clearing in 2–5 days"
          loading={balanceQuery.isLoading}
          tooltip="Charges still clearing through the payment network. This amount moves to Available Balance in 2–5 business days."
        />
        <KpiCard
          label="Paid to Bank"
          value={paidToBankUsd !== null ? formatCurrency(paidToBankUsd) : "-"}
          sub="total swept via payouts"
          loading={payoutsQuery.isLoading}
          highlight="emerald"
          tooltip="Total amount Stripe has already transferred to your bank account via payouts (all time). This is where most of your revenue lives."
        />
      </div>

      {/* ── Hero chart ── */}
      <div className="glass-card rounded-card border border-glass-hairline shadow-contact p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-ink-strong">Revenue over time</p>
            <p className="text-xs text-ink-soft mt-0.5">Succeeded charges by day</p>
          </div>
          {chargesQuery.data && (
            <p className="text-xl font-bold text-ink-strong tabular-nums">{formatCurrency(totalCollected)}</p>
          )}
        </div>
        {chargesQuery.isLoading ? (
          <Skeleton className="h-44 w-full bg-surface-sunken rounded-lg" />
        ) : chartData.length > 0 ? (
          <ChartFrame height={176}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
              {areaFade("revenueGrad", CHART_COLORS.brand)}
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="day" tick={AXIS_TICK_SM} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={AXIS_TICK_SM} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} width={36} />
              <RechartsTooltip content={<ChartTooltip />} />
              <Area {...NO_TWEEN} type="monotone" dataKey="revenue" stroke={CHART_COLORS.brand} strokeWidth={1.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 4, fill: CHART_COLORS.brand, strokeWidth: 0 }} />
            </AreaChart>
          </ChartFrame>
        ) : (
          <ChartEmpty height={176}>No charge data yet</ChartEmpty>
        )}
      </div>

      {/* ── Bottom 6 KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Monthly Subs"    value={metrics ? formatNumber(metrics.monthlyUsers) : "-"}              sub={`${formatUsd(PLANS[0].monthly)}–${formatUsd(PLANS[PLANS.length - 1].monthly)}/mo`} loading={metricsLoading}      tooltip={`Firms billed monthly, across all three tiers (${formatUsd(PLANS[0].monthly)}–${formatUsd(PLANS[PLANS.length - 1].monthly)}/mo).`} />
        <KpiCard label="Annual Subs"     value={metrics ? formatNumber(metrics.yearlyUsers) : "-"}               sub={`${formatUsd(PLANS[0].annual)}–${formatUsd(PLANS[PLANS.length - 1].annual)}/yr`}  loading={metricsLoading}      tooltip={`Firms billed annually, across all three tiers (${formatUsd(PLANS[0].annual)}–${formatUsd(PLANS[PLANS.length - 1].annual)}/yr).`} />
        <KpiCard label="Conversion"      value={metrics ? formatPct(conversionPct) : "-"}                        sub={metrics ? `${metrics.paidCustomers} paid of ${metrics.totalUsers}` : undefined} loading={metricsLoading} tooltip="Percentage of all registered users who are distinct paying customers (deduped by email, duplicate subscriptions count once)." />
        <KpiCard label="Avg Transaction" value={chargesQuery.data ? formatCurrency(avgTx) : "-"}                 sub={`${succeededCharges.length} succeeded`} loading={chargesQuery.isLoading} tooltip="Average charge amount across all succeeded transactions in the selected period." />
      </div>

      {/* ── Revenue breakdown — how revenue is generated ── */}
      <div className="rounded-2xl border border-glass-hairline bg-surface p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink-strong">Revenue breakdown</p>
          <p className="text-xs text-ink-soft mt-0.5">How recurring revenue is generated, and whether it's flowing</p>
        </div>

        {/* Health verdict banner */}
        {metrics && (
          <div className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            healthOk ? "border-success-border bg-success-bg text-success-text"
                     : "border-warning-border bg-warning-bg text-warning-text"
          )}>
            {healthVerdict}
          </div>
        )}

        {/* By plan */}
        <div>
          <p className="text-[11px] uppercase tracking-wider text-ink-soft mb-2">MRR by plan</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-glass-hairline bg-surface-sunken p-3.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-ink-soft">Monthly plans</p>
                <span className="text-[11px] text-ink-faint">{metrics ? `${metrics.activeMonthlySubs} subs` : "-"}</span>
              </div>
              <p className="text-lg font-bold text-ink-strong tabular-nums">{metrics ? formatCurrency(monthlyMrr) : "-"}<span className="ml-1 text-[11px] font-normal text-ink-soft">/mo</span></p>
              {mrrTotal > 0 && (
                <div className="mt-2 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                  <div className="h-full bg-brand" style={{ width: `${monthlyShare}%` }} />
                </div>
              )}
              <p className="mt-1 text-[11px] text-ink-faint">{formatPct(monthlyShare)} of MRR</p>
            </div>
            <div className="rounded-card border border-glass-hairline bg-surface-sunken p-3.5">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-ink-soft">Annual plans</p>
                <span className="text-[11px] text-ink-faint">{metrics ? `${metrics.activeYearlySubs} subs` : "-"}</span>
              </div>
              <p className="text-lg font-bold text-ink-strong tabular-nums">{metrics ? formatCurrency(yearlyMrr) : "-"}<span className="ml-1 text-[11px] font-normal text-ink-soft">/mo</span></p>
              {mrrTotal > 0 && (
                <div className="mt-2 h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                  <div className="h-full bg-success" style={{ width: `${yearlyShare}%` }} />
                </div>
              )}
              <p className="mt-1 text-[11px] text-ink-faint">{formatPct(yearlyShare)} of MRR · {metrics ? formatCurrency(metrics.arrCents / 100) : "-"} ARR</p>
            </div>
          </div>
        </div>

        {/* Gross vs net + new vs returning */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label="Gross (period)" value={chargesQuery.data ? formatCurrency(totalCollected) : "-"} sub="collected charges" loading={chargesQuery.isLoading} tooltip="Total succeeded charges in the period, before any fees." />
          <KpiCard label="Est. net" value={chargesQuery.data ? formatCurrency(netCollected) : "-"} sub="after Stripe fees" loading={chargesQuery.isLoading} highlight="emerald" tooltip="Gross minus estimated Stripe fees (2.9% + $0.30 per successful charge). Real fees may vary by card/region." />
          <KpiCard label="New customers" value={chargesQuery.data ? formatNumber(newCustomers) : "-"} sub="1 charge this period" loading={chargesQuery.isLoading} tooltip="Emails with exactly one succeeded charge in the period, likely first-time payers." />
          <KpiCard label="Returning" value={chargesQuery.data ? formatNumber(returningCustomers) : "-"} sub="repeat charges" loading={chargesQuery.isLoading} tooltip="Emails with more than one succeeded charge in the period, renewals or repeat purchases." />
        </div>
      </div>

      {/* ── By-platform breakdown ── */}
      <PlatformBreakdown />

      {/* ── Transactions table ── */}
      <div className="rounded-2xl border border-glass-hairline bg-surface overflow-hidden">
        <div className="px-6 py-4 border-b border-glass-hairline flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-strong">Recent Transactions</p>
            <p className="text-xs text-ink-soft mt-0.5">Last 20 charges, live from Stripe</p>
          </div>
          <button
            onClick={() => navigate("/transactions")}
            className="flex items-center gap-1 text-xs text-brand-deep hover:text-brand-deep transition-colors"
          >
            View all <ArrowRight className="h-3 w-3" />
          </button>
        </div>
        <DataTable
          columns={columns}
          data={charges}
          loading={chargesQuery.isLoading}
          emptyMessage="No transactions found"
          onRowClick={(c) => setSelectedCharge(c)}
        />
      </div>

      <TransactionDetailDrawer charge={selectedCharge as ChargeLike | null} open={!!selectedCharge} onClose={() => setSelectedCharge(null)} />
      <ProfitBreakdownModal
        open={showProfitBreakdown}
        onClose={() => setShowProfitBreakdown(false)}
        metrics={metrics}
      />
    </div>
    </TooltipProvider>
  );
}
