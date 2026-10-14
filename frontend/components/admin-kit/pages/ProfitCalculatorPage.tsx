'use client';
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  CartesianGrid, Legend,
} from "recharts";
import { AXIS_TICK_SM, CHART_COLORS, ChartFrame, GRID_PROPS, LEGEND_STYLE, NO_TWEEN } from "@/lib/charts";
import { RotateCcw, Plus, Trash2 } from "lucide-react";
import { PageHeader } from "../components/PageHeader";
import { useAdminMetrics } from "../lib/queries";
import { formatCurrency, formatNumber, formatPct } from "../lib/formatters";
import {
  OVERAGE_USD_PER_CHECK, PLANS, STRIPE_FEE_FLAT_USD, STRIPE_FEE_PCT,
  type PlanTier,
} from "@/lib/pricing";
import { Table, Tbody, Td, Th, Thead, Tr, TableShell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
// Pure arithmetic, extracted so it can be checked without a browser or env.
import { monthAt, type CalcInputs, type MonthResult, type ServiceItem, type TierRow } from "../lib/profit-model";

/* Row height for this page's tables, declared once. The shared `tdVariants`
   recipe is py-3; these are reference tables an operator scans top to bottom,
   so they run tighter. The primitive is not edited to get there. */
const DENSE_CALC = '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2';

/* ─── Editable model ───────────────────────────────────────────────────────
   Kyriq sells three monthly tiers to accounting firms, each with a cheque
   allowance and the same per-cheque overage rate. Revenue is therefore
   subscription + overage, and the real COGS is per-cheque OCR/Gemini spend —
   not a per-seat AI cost. Every field below is editable so the owner can model
   a price that has not shipped; Stripe remains the source of truth for what is
   actually billed. */


const DEFAULT_TIERS: TierRow[] = PLANS.map((p) => ({
  tier: p.tier,
  name: p.name,
  monthlyPrice: p.monthly,
  annualPrice: p.annual,
  allowance: p.allowance,
  monthlyFirms: 0,
  annualFirms: 0,
  // Seeded at the allowance: the neutral assumption is that a firm buys the
  // tier that fits its volume, so it generates no overage until you say so.
  chequesPerFirm: p.allowance,
}));

const DEFAULTS: CalcInputs = {
  tiers: DEFAULT_TIERS,
  growthPct: 8,
  churnPct: 3,
  overageRate: OVERAGE_USD_PER_CHECK,
  costPerCheque: 0.03,
  stripeFeePct: STRIPE_FEE_PCT,
  stripeFeeFlat: STRIPE_FEE_FLAT_USD,
  fixedMonthly: 400,
  horizon: 12,
};

/* ─── Custom services / add-ons (extra revenue beyond subscriptions) ───────
   Seeded EMPTY on purpose. Kyriq's published plans (lib/pricing.ts) and the
   landing page list no paid add-on — priority support and onboarding
   assistance are bundled into the Professional and Firm tiers, not sold. The
   table stays because modelling a service you are considering is useful; it is
   not pre-filled with a product Kyriq does not sell. */

const DEFAULT_SERVICES: ServiceItem[] = [];

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

/** Bare numeric cell input, for the editable tables. */
function CellNumber({
  value, onChange, step = 1, prefix, label,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  prefix?: string;
  label: string;
}) {
  return (
    <div className="flex items-center rounded-md border border-glass-hairline bg-surface-sunken focus-within:border-brand/50">
      {prefix && <span className="pl-2 text-xs text-ink-soft">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        aria-label={label}
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full bg-transparent px-2 py-1 text-right text-sm text-ink-strong outline-none tabular-nums"
      />
    </div>
  );
}

/** Row-number header cell. Every table row is numbered and indexable. */
function RowNum({ n }: { n: number }) {
  return (
    <th
      scope="row"
      className="w-9 border-b border-glass-hairline px-3 py-2 text-right text-xs font-normal text-ink-faint tabular-nums"
    >
      {n}
    </th>
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
        <p key={p.name} className="text-sm font-semibold tabular-nums" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

/* ─── One month of the model ───────────────────────────────────────────────
   `factor` compounds net growth; it scales firm counts and add-on buyers. */


export default function ProfitCalculatorPage() {
  const { data: metrics } = useAdminMetrics();
  const [inputs, setInputs] = useState<CalcInputs>(DEFAULTS);
  const seeded = useRef(false);

  // Build the "live numbers" snapshot from real data.
  //
  // Two things are NOT measured and are therefore assumptions, labelled as such
  // in the UI rather than presented as data:
  //  1. OCR/Gemini spend is not recorded anywhere in Kyriq's DB (DepthMe read a
  //     daily_costs table; Kyriq has no equivalent), so cost-per-cheque stays
  //     at the editable default.
  //  2. admin-metrics reports subscription counts but not the plan tier, so the
  //     live firms are all placed on Professional and the operator moves them.
  const liveDefaults = useMemo<CalcInputs>(() => {
    const monthly = metrics?.activeMonthlySubs ?? metrics?.monthlyUsers ?? 0;
    const annual = metrics?.activeYearlySubs ?? metrics?.yearlyUsers ?? 0;
    return {
      ...DEFAULTS,
      tiers: DEFAULT_TIERS.map((t) =>
        t.tier === 'professional'
          ? { ...t, monthlyFirms: monthly, annualFirms: annual }
          : { ...t }
      ),
    };
  }, [metrics]);

  // Seed inputs from live numbers once the query has resolved.
  useEffect(() => {
    if (!seeded.current && metrics) {
      setInputs(liveDefaults);
      seeded.current = true;
    }
  }, [metrics, liveDefaults]);

  const set = (k: Exclude<keyof CalcInputs, 'tiers'>) => (n: number) =>
    setInputs((prev) => ({ ...prev, [k]: Number.isFinite(n) ? n : 0 }));

  const setTier = (tier: PlanTier, patch: Partial<TierRow>) =>
    setInputs((prev) => ({
      ...prev,
      tiers: prev.tiers.map((t) => (t.tier === tier ? { ...t, ...patch } : t)),
    }));
  const tierNum = (tier: PlanTier, k: keyof TierRow) => (n: number) =>
    setTier(tier, { [k]: Number.isFinite(n) ? n : 0 } as Partial<TierRow>);

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

  /* ─── This month ─── */
  const now = useMemo(() => monthAt(inputs, services, 1), [inputs, services]);

  /* ─── Projection math ─── */
  const projection = useMemo(() => {
    const netGrowth = (inputs.growthPct - inputs.churnPct) / 100;
    const rows: Array<MonthResult & { month: string; revenue: number; cumulative: number }> = [];
    let cumulative = 0;
    for (let i = 0; i < inputs.horizon; i++) {
      const m = monthAt(inputs, services, Math.pow(1 + netGrowth, i));
      cumulative += m.profit;
      rows.push({
        ...m,
        month: `M${i + 1}`,
        revenue: Math.round(m.gross * 100) / 100,
        profit: Math.round(m.profit * 100) / 100,
        cumulative: Math.round(cumulative * 100) / 100,
      });
    }
    return rows;
  }, [inputs, services]);

  const margin = now.gross > 0 ? (now.profit / now.gross) * 100 : 0;

  // Break-even: how many firms, at today's mix, cover the fixed costs. Blended
  // from the current scenario, so it answers "at this mix", not "in general".
  const perFirmRevenue = now.firms > 0 ? (now.subscription + now.overage) / now.firms : 0;
  const perFirmCheques = now.firms > 0 ? now.cheques / now.firms : 0;
  const perFirmCharges = now.firms > 0
    ? inputs.tiers.reduce((s, t) => s + (t.monthlyFirms || 0) + (t.annualFirms || 0) / 12, 0) / now.firms
    : 1;
  const contributionPerFirm =
    perFirmRevenue * (1 - inputs.stripeFeePct / 100)
    - perFirmCharges * inputs.stripeFeeFlat
    - perFirmCheques * inputs.costPerCheque;
  const addOnContribution = now.addOns * (1 - inputs.stripeFeePct / 100);
  const fixedAfterServices = inputs.fixedMonthly - addOnContribution;
  const breakEvenFirms = fixedAfterServices <= 0
    ? 0
    : contributionPerFirm > 0
      ? Math.ceil(fixedAfterServices / contributionPerFirm)
      : null;

  const serviceRevenueM1 = now.addOns;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Profit Calculator"
        description="Kyriq's three tiers, their cheque allowances and the $0.20 overage. Firm counts come from live subscriptions; cheque volume and OCR cost are assumptions — tweak any field to model a scenario."
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
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <Kpi label="MRR (gross)" value={formatCurrency(now.gross)} sub={`${formatNumber(Math.round(now.firms))} firms`} />
        <Kpi label="Overage rev" value={formatCurrency(now.overage)} sub={`${formatNumber(Math.round(now.overageCheques))} cheques over`} />
        <Kpi label="Total costs" value={formatCurrency(now.cost)} sub="OCR + Stripe + fixed" />
        <Kpi
          label="Net profit / mo"
          value={formatCurrency(now.profit)}
          highlight={now.profit >= 0 ? "emerald" : "red"}
          sub={`${formatPct(margin)} margin`}
        />
        <Kpi
          label="Break-even firms"
          value={breakEvenFirms !== null ? formatNumber(breakEvenFirms) : "—"}
          sub={breakEvenFirms !== null ? "at this tier mix" : "raise price / cut cheque cost"}
          highlight={breakEvenFirms !== null && now.firms >= breakEvenFirms ? "emerald" : undefined}
        />
        <Kpi
          label={`${inputs.horizon}-mo profit`}
          value={formatCurrency(projection[projection.length - 1]?.cumulative ?? 0)}
          highlight={(projection[projection.length - 1]?.cumulative ?? 0) >= 0 ? "emerald" : "red"}
          sub="cumulative"
        />
      </div>

      {/* ── Plans ── */}
      <TableShell>
        <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-glass-hairline">
          <div>
            <p className="text-sm font-semibold text-ink-strong">Plans &amp; firm mix</p>
            <p className="text-xs text-ink-soft mt-0.5">
              Seeded from lib/pricing.ts. Annual is counted at a twelfth, so the columns compare like with like.
            </p>
          </div>
          <p className="text-sm font-bold text-ink-strong tabular-nums">
            {formatCurrency(now.subscription)}<span className="text-[11px] text-ink-soft font-normal">/mo subs</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table className={DENSE_CALC}>
            <Thead>
              <Tr>
                <Th className="w-9 text-right">No.</Th>
                <Th>Plan</Th>
                <Th numeric>$ / mo</Th>
                <Th numeric>$ / yr</Th>
                <Th numeric>Allowance</Th>
                <Th numeric>Cheques / firm</Th>
                <Th numeric>Monthly firms</Th>
                <Th numeric>Annual firms</Th>
                <Th numeric>Sub rev / mo</Th>
                <Th numeric>Overage / mo</Th>
              </Tr>
            </Thead>
            <Tbody>
              {inputs.tiers.map((t, i) => {
                const m = t.monthlyFirms || 0;
                const a = t.annualFirms || 0;
                const n = m + a;
                const sub = m * (t.monthlyPrice || 0) + a * ((t.annualPrice || 0) / 12);
                const over = n * Math.max(0, (t.chequesPerFirm || 0) - (t.allowance || 0)) * inputs.overageRate;
                return (
                  <Tr key={t.tier}>
                    <RowNum n={i + 1} />
                    <Td className="whitespace-nowrap font-medium">{t.name}</Td>
                    <Td><CellNumber label={`${t.name} monthly price`} prefix="$" step={10} value={t.monthlyPrice} onChange={tierNum(t.tier, 'monthlyPrice')} /></Td>
                    <Td><CellNumber label={`${t.name} annual price`} prefix="$" step={100} value={t.annualPrice} onChange={tierNum(t.tier, 'annualPrice')} /></Td>
                    <Td><CellNumber label={`${t.name} cheque allowance`} step={100} value={t.allowance} onChange={tierNum(t.tier, 'allowance')} /></Td>
                    <Td><CellNumber label={`${t.name} cheques per firm`} step={100} value={t.chequesPerFirm} onChange={tierNum(t.tier, 'chequesPerFirm')} /></Td>
                    <Td><CellNumber label={`${t.name} firms billed monthly`} value={t.monthlyFirms} onChange={tierNum(t.tier, 'monthlyFirms')} /></Td>
                    <Td><CellNumber label={`${t.name} firms billed annually`} value={t.annualFirms} onChange={tierNum(t.tier, 'annualFirms')} /></Td>
                    <Td numeric>{formatCurrency(sub)}</Td>
                    <Td numeric className={over > 0 ? "text-success-text" : "text-ink-faint"}>{formatCurrency(over)}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </div>
        <p className="px-4 py-2.5 text-[11px] text-ink-faint border-t border-glass-hairline">
          <span className="text-ink-soft">Assumption</span> — cheques/firm is seeded at each tier&apos;s allowance (so no overage until you say otherwise):
          Kyriq does not record per-firm cheque volume against a plan. <span className="text-ink-soft">Assumption</span> — admin-metrics reports
          subscription counts but not the tier, so live firms all land on Professional; move them between rows.
        </p>
      </TableShell>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {/* ── Inputs ── */}
        <div className="glass-card rounded-card border border-glass-hairline shadow-contact p-4 space-y-3">
          <p className="text-sm font-semibold text-ink-strong mb-1">Assumptions</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Growth / mo" suffix="%" step={0.5} value={inputs.growthPct} onChange={set("growthPct")} />
            <Field label="Churn / mo" suffix="%" step={0.5} value={inputs.churnPct} onChange={set("churnPct")} />
            <Field label="Overage / cheque" prefix="$" step={0.01} value={inputs.overageRate} onChange={set("overageRate")} />
            <Field label="OCR cost / cheque" prefix="$" step={0.005} value={inputs.costPerCheque} onChange={set("costPerCheque")} />
            <Field label="Stripe fee" suffix="%" step={0.1} value={inputs.stripeFeePct} onChange={set("stripeFeePct")} />
            <Field label="Stripe / charge" prefix="$" step={0.05} value={inputs.stripeFeeFlat} onChange={set("stripeFeeFlat")} />
            <Field label="Fixed / mo" prefix="$" step={25} value={inputs.fixedMonthly} onChange={set("fixedMonthly")} />
            <Field label="Horizon (mo)" value={inputs.horizon} onChange={(n) => set("horizon")(Math.max(1, Math.min(60, Math.round(n))))} />
          </div>
          <div className="rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-2.5 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-ink-soft">This month, broken down</p>
            {[
              ['Subscriptions', now.subscription],
              ['Overage', now.overage],
              ['Add-ons', now.addOns],
              ['OCR processing', -now.processingCost],
              ['Stripe fees', -now.stripeCost],
              ['Fixed', -inputs.fixedMonthly],
            ].map(([label, amount]) => (
              <p key={label as string} className="flex items-center justify-between text-xs">
                <span className="text-ink-soft">{label}</span>
                <span className={cn("tabular-nums", (amount as number) < 0 ? "text-error-text" : "text-ink-strong")}>
                  {formatCurrency(amount as number)}
                </span>
              </p>
            ))}
          </div>
          <p className="text-[11px] text-ink-faint">
            <span className="text-ink-soft">Assumption</span> — OCR cost per cheque is not measured: Kyriq records no
            Gemini/Tesseract spend in the database. The default is a placeholder, not a reading.
          </p>
        </div>

        {/* ── Projection chart ── */}
        <div className="glass-card rounded-card border border-glass-hairline shadow-contact p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-ink-strong">Profit projection</p>
              <p className="text-xs text-ink-soft mt-0.5">{inputs.horizon} months at {formatPct(inputs.growthPct - inputs.churnPct)} net growth/mo</p>
            </div>
          </div>
          <ChartFrame height={260}>
            <LineChart data={projection} margin={{ top: 4, right: 8, bottom: 0, left: -4 }}>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis dataKey="month" tick={AXIS_TICK_SM} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={AXIS_TICK_SM} axisLine={false} tickLine={false} tickFormatter={(v) => `$${Math.round(v)}`} width={48} />
              <RechartsTooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={LEGEND_STYLE} />
              {/* Profit is semantic here — this chart's whole job is "are we in the
                  black" — so it takes --success, not a categorical slot. Revenue is
                  the brand line; Cumulative takes the neutral series rather than
                  amber (which means "needs attention" everywhere else) and rather
                  than a second indigo, which would not read apart from Revenue at
                  1.5px. */}
              <Line {...NO_TWEEN} type="monotone" dataKey="revenue" name="Revenue" stroke={CHART_COLORS.brand} strokeWidth={1.5} dot={false} />
              <Line {...NO_TWEEN} type="monotone" dataKey="profit" name="Profit" stroke={CHART_COLORS.emerald} strokeWidth={1.5} dot={false} />
              <Line {...NO_TWEEN} type="monotone" dataKey="cumulative" name="Cumulative" stroke={CHART_COLORS.inkFaint} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ChartFrame>
        </div>
      </div>

      {/* ── Services & add-ons ── */}
      <TableShell>
        <div className="flex items-start justify-between gap-4 px-4 py-3 border-b border-glass-hairline">
          <div>
            <p className="text-sm font-semibold text-ink-strong">Services &amp; add-ons</p>
            <p className="text-xs text-ink-soft mt-0.5">
              Empty by default — Kyriq sells no paid add-on today. Add one to model it.
            </p>
          </div>
          <p className="text-sm font-bold text-success-text tabular-nums">
            {formatCurrency(serviceRevenueM1)}<span className="text-[11px] text-ink-soft font-normal">/mo</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <Table className={DENSE_CALC}>
            <Thead>
              <Tr>
                <Th className="w-9 text-right">No.</Th>
                <Th>Service</Th>
                <Th numeric>Price</Th>
                <Th>Type</Th>
                <Th numeric>Buyers / mo</Th>
                <Th numeric>Revenue / mo</Th>
                <Th className="w-10" />
              </Tr>
            </Thead>
            <Tbody>
              {services.length === 0 ? (
                <Tr>
                  <Td colSpan={7} className="py-6 text-center text-sm text-ink-soft">
                    No add-ons modelled. Everything Kyriq ships is inside the three plans.
                  </Td>
                </Tr>
              ) : (
                services.map((s, i) => (
                  <Tr key={s.id}>
                    <RowNum n={i + 1} />
                    <Td>
                      <input
                        value={s.name}
                        onChange={(e) => updateService(s.id, { name: e.target.value })}
                        placeholder="Service name"
                        aria-label="Service name"
                        className="w-full min-w-[9rem] rounded-md border border-glass-hairline bg-surface-sunken px-2 py-1 text-sm text-ink-strong outline-none focus:border-brand/50"
                      />
                    </Td>
                    <Td>
                      <CellNumber label={`${s.name} price`} prefix="$" step={5} value={s.price}
                        onChange={(n) => updateService(s.id, { price: Number.isFinite(n) ? n : 0 })} />
                    </Td>
                    <Td>
                      <select
                        value={s.unit}
                        aria-label={`${s.name} billing type`}
                        onChange={(e) => updateService(s.id, { unit: e.target.value as ServiceItem['unit'] })}
                        className="rounded-md border border-glass-hairline bg-surface-sunken px-2 py-1 text-sm text-ink-strong outline-none focus:border-brand/50"
                      >
                        <option value="one-time">One-time</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </Td>
                    <Td>
                      <CellNumber label={`${s.name} buyers per month`} value={s.buyersPerMonth}
                        onChange={(n) => updateService(s.id, { buyersPerMonth: Number.isFinite(n) ? n : 0 })} />
                    </Td>
                    <Td numeric>{formatCurrency((s.price || 0) * (s.buyersPerMonth || 0))}</Td>
                    <Td>
                      <button
                        onClick={() => removeService(s.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-error-text/70 hover:text-error-text hover:bg-error-bg transition-colors"
                        aria-label={`Remove ${s.name}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </div>
        <div className="flex items-center gap-3 border-t border-glass-hairline px-4 py-2.5">
          <button
            onClick={addService}
            className="flex items-center gap-1.5 rounded-lg border border-glass-hairline bg-surface-sunken px-3 py-1.5 text-xs text-ink-body hover:text-ink-strong hover:bg-surface-sunken transition-colors"
          >
            <Plus size={13} /> Add service
          </button>
          <p className="text-[11px] text-ink-faint">
            One-time vs monthly only labels the income stream — both are modelled as that month&apos;s inflow, scale with firm growth, and each buyer adds one Stripe charge.
          </p>
        </div>
      </TableShell>

      {/* ── Projection table ── */}
      <TableShell>
        <div className="px-4 py-3 border-b border-glass-hairline">
          <p className="text-sm font-semibold text-ink-strong">Month-by-month</p>
        </div>
        <div className="overflow-x-auto">
          <Table className={DENSE_CALC}>
            <Thead>
              <Tr>
                <Th className="w-9 text-right">No.</Th>
                <Th>Month</Th>
                <Th numeric>Firms</Th>
                <Th numeric>Cheques</Th>
                <Th numeric>Subs</Th>
                <Th numeric>Overage</Th>
                <Th numeric>Revenue</Th>
                <Th numeric>Costs</Th>
                <Th numeric>Profit</Th>
                <Th numeric>Cumulative</Th>
              </Tr>
            </Thead>
            <Tbody>
              {projection.map((r, i) => (
                <Tr key={r.month}>
                  <RowNum n={i + 1} />
                  <Td muted className="whitespace-nowrap">{r.month}</Td>
                  <Td numeric>{formatNumber(Math.round(r.firms))}</Td>
                  <Td numeric>{formatNumber(Math.round(r.cheques))}</Td>
                  <Td numeric>{formatCurrency(r.subscription)}</Td>
                  <Td numeric className={r.overage > 0 ? "text-success-text" : "text-ink-faint"}>{formatCurrency(r.overage)}</Td>
                  <Td numeric>{formatCurrency(r.revenue)}</Td>
                  <Td numeric className="text-ink-body">{formatCurrency(r.cost)}</Td>
                  <Td numeric className={r.profit >= 0 ? "text-success-text" : "text-error-text"}>{formatCurrency(r.profit)}</Td>
                  <Td numeric className={r.cumulative >= 0 ? "text-ink-strong" : "text-error-text"}>{formatCurrency(r.cumulative)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </div>
      </TableShell>
    </div>
  );
}
