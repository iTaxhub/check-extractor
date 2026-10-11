'use client';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { RotateCcw, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useAdminMetrics } from "../lib/queries";
import { formatCurrency, formatNumber, formatPct } from "../lib/formatters";
import { PRICE_MONTHLY_USD, PRICE_YEARLY_USD } from "@/components/admin-kit/_deps/lib/pricing";
import { cn } from "@/lib/utils";


/* ─── Editable model ─── */
interface CalcInputs {
  monthlyPrice: number;
  annualPrice: number;
  monthlySubs: number;
  annualSubs: number;
  growthPct: number;     // new subscribers / month (%)
  churnPct: number;      // lost subscribers / month (%)
  aiCostPerUser: number; // $/active user/month
  stripeFeePct: number;  // % of gross revenue
  fixedMonthly: number;  // hosting + misc fixed costs
  horizon: number;       // projection length in months
}

const DEFAULTS: CalcInputs = {
  // Plan prices come from src/lib/pricing.ts — the one display-price module.
  // They seed the model; every field here is editable, so the owner can still
  // simulate a price they haven't shipped. Stripe remains the source of truth
  // for what customers are actually billed.
  monthlyPrice: PRICE_MONTHLY_USD,
  annualPrice: PRICE_YEARLY_USD,
  monthlySubs: 0,
  annualSubs: 0,
  growthPct: 8,
  churnPct: 3,
  aiCostPerUser: 0.5,
  stripeFeePct: 2.9,
  fixedMonthly: 50,
  horizon: 12,
};

/* ─── Custom services / add-ons (extra revenue beyond subscriptions) ─── */
interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: 'one-time' | 'monthly';
  buyersPerMonth: number;
}

const DEFAULT_SERVICES: ServiceItem[] = [
  { id: 'voice-clone', name: 'Voice Clone', price: 5, unit: 'one-time', buyersPerMonth: 10 },
];

/* ─── Small input field ─── */
function Field({
  label, value, onChange, prefix, suffix, step = 1,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-ink-soft uppercase tracking-wider">{label}</span>
      <div className="mt-1 flex items-center rounded-lg border border-glass-hairline bg-surface focus-within:border-brand/50 transition-colors">
        {prefix && <span className="pl-3 text-sm text-ink-soft">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full bg-transparent px-3 py-2 text-sm text-ink-strong outline-none tabular-nums"
        />
        {suffix && <span className="pr-3 text-sm text-ink-soft">{suffix}</span>}
      </div>
    </label>
  );
}

/* ─── KPI tile ─── */
function Kpi({ label, value, highlight, sub }: { label: string; value: string; highlight?: "emerald" | "red"; sub?: string }) {
  return (
    <div className={cn(
      "rounded-xl border bg-surface p-3.5",
      highlight === "emerald" ? "border-success-border" :
      highlight === "red" ? "border-error-border" : "border-glass-hairline"
    )}>
      <p className="text-[11px] text-ink-soft uppercase tracking-wider truncate">{label}</p>
      <p className={cn(
        "mt-1.5 text-xl font-bold tabular-nums leading-none",
        highlight === "emerald" ? "text-success-text" :
        highlight === "red" ? "text-error-text" : "text-ink-strong"
      )}>{value}</p>
      {sub && <p className="mt-1 text-[11px] text-ink-faint truncate">{sub}</p>}
    </div>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-card border border-glass-hairline bg-surface-sunken px-3 py-2 shadow-2xl">
      <p className="text-xs text-ink-soft mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export default function ProfitCalculatorPage() {
  const { data: metrics } = useAdminMetrics();
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULTS);
  const seeded = useRef(false);


  // Build the "live numbers" snapshot from real data.
  const liveDefaults = useMemo<CalcInputs>(() => {
    const monthlySubs = metrics?.monthlyUsers ?? 0;
    const annualSubs = metrics?.yearlyUsers ?? 0;
    // OCR spend is not recorded in Kyriq's DB (DepthMe read daily_costs), so the
    // per-user cost stays at the editable default.
    return { ...DEFAULTS, monthlySubs, annualSubs };
  }, [metrics]);

  // Seed inputs from live numbers once both queries have resolved.
  useEffect(() => {
    if (!seeded.current && metrics) {
      setInputs(liveDefaults);
      seeded.current = true;
    }
  }, [metrics, liveDefaults]);

  const set = (k: keyof CalcInputs) => (n: number) =>
    setInputs((prev) => ({ ...prev, [k]: Number.isFinite(n) ? n : 0 }));

  // Services are separate manual "ideas" — intentionally NOT reset by "Reset to live numbers".
  const [services, setServices] = useState<ServiceItem[]>(DEFAULT_SERVICES);
  const updateService = (id: string, patch: Partial<ServiceItem>) =>
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeService = (id: string) => setServices((prev) => prev.filter((s) => s.id !== id));
  const addService = () =>
    setServices((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), name: 'New service', price: 0, unit: 'one-time', buyersPerMonth: 0 },
    ]);

  // Service revenue for a given growth factor (buyers scale with the user base).
  const serviceRevenueAt = (factor: number) =>
    services.reduce((sum, s) => sum + (s.price || 0) * (s.buyersPerMonth || 0) * factor, 0);
  const serviceRevenueM1 = serviceRevenueAt(1);

  /* ─── Projection math ─── */
  const projection = useMemo(() => {
    const netGrowth = (inputs.growthPct - inputs.churnPct) / 100;
    const rows: Array<{ month: string; revenue: number; profit: number; cumulative: number; subs: number }> = [];
    let cumulative = 0;
    for (let i = 0; i < inputs.horizon; i++) {
      const factor = Math.pow(1 + netGrowth, i);
      const mSubs = inputs.monthlySubs * factor;
      const aSubs = inputs.annualSubs * factor;
      const subs = mSubs + aSubs;
      const subRevenue = mSubs * inputs.monthlyPrice + aSubs * (inputs.annualPrice / 12);
      const revenue = subRevenue + serviceRevenueAt(factor);
      const stripe = revenue * (inputs.stripeFeePct / 100);
      const ai = subs * inputs.aiCostPerUser;
      const cost = stripe + ai + inputs.fixedMonthly;
      const profit = revenue - cost;
      cumulative += profit;
      rows.push({
        month: `M${i + 1}`,
        revenue: Math.round(revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        cumulative: Math.round(cumulative * 100) / 100,
        subs: Math.round(subs),
      });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, services]);

  const totalSubs = inputs.monthlySubs + inputs.annualSubs;
  const subRevenue = inputs.monthlySubs * inputs.monthlyPrice + inputs.annualSubs * (inputs.annualPrice / 12);
  const grossRevenue = subRevenue + serviceRevenueM1;
  const totalCosts = grossRevenue * (inputs.stripeFeePct / 100) + totalSubs * inputs.aiCostPerUser + inputs.fixedMonthly;
  const netProfit = grossRevenue - totalCosts;
  const margin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

  // Break-even: subscribers needed to cover fixed costs after service revenue offsets them.
  const avgPrice = totalSubs > 0 ? subRevenue / totalSubs : inputs.monthlyPrice;
  const contributionPerSub = avgPrice * (1 - inputs.stripeFeePct / 100) - inputs.aiCostPerUser;
  const fixedAfterServices = inputs.fixedMonthly - serviceRevenueM1 * (1 - inputs.stripeFeePct / 100);
  const breakEvenSubs = fixedAfterServices <= 0
    ? 0
    : contributionPerSub > 0
      ? Math.ceil(fixedAfterServices / contributionPerSub)
      : null;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Profit Calculator"
        description="Simulate revenue, costs, and break-even. Inputs are pre-filled from live numbers — tweak any field to model scenarios."
        actions={
          <button
            onClick={() => setInputs(liveDefaults)}
            className="flex items-center gap-1.5 rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-1.5 text-xs text-ink-soft hover:text-ink-strong hover:bg-surface-sunken transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset to live numbers
          </button>
        }
      />

      {/* ── Headline KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Kpi label="MRR (gross)" value={formatCurrency(grossRevenue)} sub="this month" />
        <Kpi label="Total Costs" value={formatCurrency(totalCosts)} sub="AI + Stripe + fixed" />
        <Kpi
          label="Net Profit / mo"
          value={formatCurrency(netProfit)}
          highlight={netProfit >= 0 ? "emerald" : "red"}
          sub={`${formatPct(margin)} margin`}
        />
        <Kpi
          label="Break-even subs"
          value={breakEvenSubs !== null ? formatNumber(breakEvenSubs) : "—"}
          sub={breakEvenSubs !== null ? "to cover fixed costs" : "raise price / cut AI cost"}
          highlight={breakEvenSubs !== null && totalSubs >= breakEvenSubs ? "emerald" : undefined}
        />
        <Kpi
          label={`${inputs.horizon}-mo profit`}
          value={formatCurrency(projection[projection.length - 1]?.cumulative ?? 0)}
          highlight={(projection[projection.length - 1]?.cumulative ?? 0) >= 0 ? "emerald" : "red"}
          sub="cumulative"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* ── Inputs ── */}
        <div className="glass-card rounded-card border border-glass-hairline shadow-contact p-4 space-y-3">
          <p className="text-sm font-semibold text-ink-strong mb-1">Assumptions</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly price" prefix="$" step={0.01} value={inputs.monthlyPrice} onChange={set("monthlyPrice")} />
            <Field label="Annual price" prefix="$" step={0.01} value={inputs.annualPrice} onChange={set("annualPrice")} />
            <Field label="Monthly subs" value={inputs.monthlySubs} onChange={set("monthlySubs")} />
            <Field label="Annual subs" value={inputs.annualSubs} onChange={set("annualSubs")} />
            <Field label="Growth / mo" suffix="%" step={0.5} value={inputs.growthPct} onChange={set("growthPct")} />
            <Field label="Churn / mo" suffix="%" step={0.5} value={inputs.churnPct} onChange={set("churnPct")} />
            <Field label="OCR cost / firm" prefix="$" step={0.05} value={inputs.aiCostPerUser} onChange={set("aiCostPerUser")} />
            <Field label="Stripe fee" suffix="%" step={0.1} value={inputs.stripeFeePct} onChange={set("stripeFeePct")} />
            <Field label="Fixed / mo" prefix="$" step={5} value={inputs.fixedMonthly} onChange={set("fixedMonthly")} />
            <Field label="Horizon (mo)" value={inputs.horizon} onChange={(n) => set("horizon")(Math.max(1, Math.min(60, Math.round(n))))} />
          </div>
        </div>

        {/* ── Projection chart ── */}
        <div className="glass-card rounded-card border border-glass-hairline shadow-contact p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-ink-strong">Profit projection</p>
              <p className="text-xs text-ink-soft mt-0.5">{inputs.horizon} months at {formatPct(inputs.growthPct - inputs.churnPct)} net growth/mo</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={projection} margin={{ top: 4, right: 8, bottom: 0, left: -4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7f5" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v)}`} width={48} />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#6366f1" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="cumulative" name="Cumulative" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Services & add-ons ── */}
      <div className="glass-card rounded-card border border-glass-hairline shadow-contact p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-ink-strong">Services &amp; add-ons</p>
            <p className="text-xs text-ink-soft mt-0.5">Charge for specific things (e.g. voice clone) on top of subscriptions</p>
          </div>
          <p className="text-sm font-bold text-success-text tabular-nums">{formatCurrency(serviceRevenueM1)}<span className="text-[11px] text-ink-soft font-normal">/mo</span></p>
        </div>

        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[1fr_90px_110px_110px_32px] gap-2 px-1 pb-1.5 text-[10px] uppercase tracking-wider text-ink-faint">
          <span>Service</span><span>Price</span><span>Type</span><span>Buyers/mo</span><span />
        </div>

        <div className="space-y-2">
          {services.map((s) => (
            <div key={s.id} className="grid grid-cols-2 sm:grid-cols-[1fr_90px_110px_110px_32px] gap-2 items-center">
              <input
                value={s.name}
                onChange={(e) => updateService(s.id, { name: e.target.value })}
                placeholder="Service name"
                className="rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-2 text-sm text-ink-strong outline-none focus:border-brand/50"
              />
              <div className="flex items-center rounded-lg border border-glass-hairline bg-surface-sunken focus-within:border-brand/50">
                <span className="pl-2 text-sm text-ink-soft">$</span>
                <input
                  type="number" inputMode="decimal" step={0.5} value={Number.isFinite(s.price) ? s.price : ""}
                  onChange={(e) => updateService(s.id, { price: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-transparent px-2 py-2 text-sm text-ink-strong outline-none tabular-nums"
                />
              </div>
              <select
                value={s.unit}
                onChange={(e) => updateService(s.id, { unit: e.target.value as ServiceItem['unit'] })}
                className="rounded-lg border border-glass-hairline bg-surface-sunken px-2 py-2 text-sm text-ink-strong outline-none focus:border-brand/50"
              >
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
              </select>
              <input
                type="number" inputMode="numeric" step={1} value={Number.isFinite(s.buyersPerMonth) ? s.buyersPerMonth : ""}
                onChange={(e) => updateService(s.id, { buyersPerMonth: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-2 text-sm text-ink-strong outline-none focus:border-brand/50 tabular-nums"
              />
              <button
                onClick={() => removeService(s.id)}
                className="h-9 w-8 flex items-center justify-center rounded-lg text-error-text/70 hover:text-error-text hover:bg-error-bg transition-colors"
                aria-label={`Remove ${s.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addService}
          className="mt-3 flex items-center gap-1.5 rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-1.5 text-xs text-ink-body hover:text-ink-strong hover:bg-surface-sunken transition-colors"
        >
          <Plus size={13} /> Add service
        </button>
        <p className="text-[11px] text-ink-faint mt-2">One-time vs monthly only labels the income stream — both are modeled as that month&apos;s inflow and scale with user growth.</p>
      </div>

      {/* ── Projection table ── */}
      <div className="glass-card rounded-card border border-glass-hairline shadow-contact overflow-hidden">
        <div className="px-4 py-3 border-b border-glass-hairline">
          <p className="text-sm font-semibold text-ink-strong">Month-by-month</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-ink-soft">
                <th className="px-4 py-2 text-left font-medium">Month</th>
                <th className="px-4 py-2 text-right font-medium">Subs</th>
                <th className="px-4 py-2 text-right font-medium">Revenue</th>
                <th className="px-4 py-2 text-right font-medium">Profit</th>
                <th className="px-4 py-2 text-right font-medium">Cumulative</th>
              </tr>
            </thead>
            <tbody>
              {projection.map((r) => (
                <tr key={r.month} className="border-t border-glass-hairline">
                  <td className="px-4 py-2 text-ink-soft">{r.month}</td>
                  <td className="px-4 py-2 text-right text-ink-body tabular-nums">{formatNumber(r.subs)}</td>
                  <td className="px-4 py-2 text-right text-ink-body tabular-nums">{formatCurrency(r.revenue)}</td>
                  <td className={cn("px-4 py-2 text-right tabular-nums", r.profit >= 0 ? "text-success-text" : "text-error-text")}>{formatCurrency(r.profit)}</td>
                  <td className={cn("px-4 py-2 text-right tabular-nums", r.cumulative >= 0 ? "text-ink-strong" : "text-error-text")}>{formatCurrency(r.cumulative)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
