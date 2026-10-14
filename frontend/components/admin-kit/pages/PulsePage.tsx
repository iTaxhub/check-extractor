'use client';
import React from "react";
import { format } from "date-fns";
import {
  AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import {
  AXIS_TICK,
  CHART_COLORS,
  CHART_SERIES,
  ChartEmpty,
  ChartFrame,
  GRID_PROPS,
  TOOLTIP_PROPS,
  areaFade, NO_TWEEN } from "@/lib/charts";
import { PageHeader } from "../components/PageHeader";
import { ChartCard } from "../components/ChartCard";
import { useAdminMetrics, useAdminHealth } from "../lib/queries";
import { KpiTile } from "../components/KpiTile";
import { formatCurrency, formatNumber, formatRelative } from "../lib/formatters";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/admin-kit/_deps/components/ui/skeleton";

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-glass-hairline bg-surface px-3 py-2 shadow-xl">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="text-sm font-semibold text-ink-strong">{payload[0].value} signups</p>
    </div>
  );
}

function groupByDay(items: Array<{ created_at: string }>): Array<{ day: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const day = format(new Date(item.created_at), "MMM d");
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return Object.entries(counts).map(([day, count]) => ({ day, count }));
}

export default function PulsePage() {
  const { data, isLoading } = useAdminMetrics();
  const { data: health, isLoading: healthLoading } = useAdminHealth();

  const signupTrend = data?.signupsByDay ? groupByDay(data.signupsByDay) : [];

  const pct = (v: number | null | undefined) => (v == null ? "—" : `${Math.round(v * 100)}%`);
  const plans = data
    ? [
        // Four plan buckets, so the first four categorical slots in order. Comped
        // used to be amber; amber means "needs attention" everywhere else in the
        // app, so it drops to the next ordinary slot instead.
        { plan: "Monthly", count: data.monthlyUsers, color: CHART_SERIES[0] },
        { plan: "Annual", count: data.yearlyUsers, color: CHART_SERIES[1] },
        { plan: "Trial", count: data.usersOnTrial ?? 0, color: CHART_SERIES[2] },
        { plan: "Comped", count: data.grantedUsers, color: CHART_SERIES[3] },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Overview" description="Kyriq at a glance: revenue, firms and checks processed" />

      {/* ── Revenue + firms ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiTile label="MRR" value={data ? formatCurrency(data.mrrCents / 100) : "—"} loading={isLoading} />
        <KpiTile label="ARR" value={data ? formatCurrency(data.arrCents / 100) : "—"} loading={isLoading} />
        <KpiTile label="Paying firms" value={data ? formatNumber(data.paidCustomers) : "—"} loading={isLoading} />
        <KpiTile label="Firms on trial" value={data ? formatNumber(data.usersOnTrial ?? 0) : "—"} loading={isLoading} />
        <KpiTile label="Trial → paid" value={pct(data?.trialConversionRate)} loading={isLoading} />
      </div>

      {/* ── Usage in the selected range ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile label="Total users" value={data ? formatNumber(data.totalUsers) : "—"} loading={isLoading} />
        <KpiTile label="New signups" value={data ? formatNumber(data.newSignups) : "—"} loading={isLoading} />
        {/* totalAiGenerations is the check_processed sum from usage_ledger. */}
        <KpiTile label="Checks processed" value={data ? formatNumber(data.totalAiGenerations) : "—"} loading={isLoading} />
        {/* admin-metrics counts distinct usage_ledger.user_id, i.e. users, not tenants. */}
        <KpiTile label="Active users" value={data ? formatNumber(data.activeUsers) : "—"} loading={isLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {/* ── Signups trend chart ──────────────────────────────────── */}
      <ChartCard
        title="Signups Trend"
        description="New registrations in selected period"
        loading={isLoading && !signupTrend.length}
      >
        {signupTrend.length > 0 ? (
          <ChartFrame height={240}>
            <AreaChart data={signupTrend} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              {areaFade("signupGrad", CHART_COLORS.brand)}
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="day" tick={AXIS_TICK} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <Tooltip content={<CustomTooltip />} />
              <Area {...NO_TWEEN} type="monotone" dataKey="count" stroke={CHART_COLORS.brand} strokeWidth={2} fill="url(#signupGrad)" dot={false} activeDot={{ r: 4, fill: CHART_COLORS.brand, strokeWidth: 0 }} />
            </AreaChart>
          </ChartFrame>
        ) : (
          <ChartEmpty height={240}>No signup data for this period</ChartEmpty>
        )}
      </ChartCard>


      <ChartCard title="Subscriptions by plan" description="Firms by billing plan right now" loading={isLoading}>
        {plans.some((p) => p.count > 0) ? (
          <ChartFrame height={240}>
            <BarChart data={plans} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="plan" tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_PROPS} />
              <Bar {...NO_TWEEN} dataKey="count" name="Firms" radius={[4, 4, 0, 0]}>
                {plans.map((p) => <Cell key={p.plan} fill={p.color} />)}
              </Bar>
            </BarChart>
          </ChartFrame>
        ) : (
          <ChartEmpty height={240}>No subscriptions yet</ChartEmpty>
        )}
      </ChartCard>
      </div>

      {/* ── System health strip ─────────────────────────────────── */}
      <div className="glass-card rounded-card border border-glass-hairline shadow-contact px-5 py-4">
        <p className="text-xs text-ink-soft uppercase tracking-wider mb-3">System Health</p>
        {healthLoading ? (
          <div className="flex gap-4">
            <Skeleton className="h-6 w-28 bg-surface-sunken rounded-full" />
            <Skeleton className="h-6 w-28 bg-surface-sunken rounded-full" />
          </div>
        ) : health ? (
          <div className="flex items-center gap-4 flex-wrap">
            {(["db", "stripe"] as const).map((service) => (
              <div
                key={service}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1 text-xs border",
                  health[service].ok
                    ? "border-success-border bg-success-bg text-success-text"
                    : "border-error-border bg-error-bg text-error-text"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", health[service].ok ? "bg-success" : "bg-error")} />
                <span className="capitalize font-medium">{service}</span>
                {typeof health[service].latencyMs === "number" && (
                  <span className="text-[10px] opacity-70">{health[service].latencyMs}ms</span>
                )}
              </div>
            ))}
            <span className="ml-auto text-xs text-ink-faint">Last checked {formatRelative(health.timestamp)}</span>
          </div>
        ) : (
          <p className="text-xs text-ink-faint">Health check unavailable</p>
        )}
      </div>
    </div>
  );
}
