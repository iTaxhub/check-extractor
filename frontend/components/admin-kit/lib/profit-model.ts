/**
 * The Profit Calculator's arithmetic, on its own.
 *
 * It lives here rather than inside ProfitCalculatorPage.tsx for one reason: the
 * page is a client component that pulls in React, Recharts and the Supabase
 * browser client, so importing it from a check script tries to build a Supabase
 * client and dies for want of env. This file imports nothing but the plan
 * constants, which makes it testable — see scripts/check-profit-model.ts.
 *
 * It is also the only arithmetic behind the page: the KPIs, the projection
 * table and the chart all read from monthAt(), so they cannot disagree with
 * each other.
 */

import type { PlanTier } from '@/lib/pricing';

export interface TierRow {
  tier: PlanTier;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  allowance: number;
  monthlyFirms: number;
  annualFirms: number;
  /** Cheques one firm on this tier processes per month. An assumption — see note. */
  chequesPerFirm: number;
}

export interface CalcInputs {
  tiers: TierRow[];
  growthPct: number;        // new firms / month (%)
  churnPct: number;         // lost firms / month (%)
  overageRate: number;      // $ per cheque beyond the allowance
  costPerCheque: number;    // $ OCR + Gemini spend per cheque (COGS)
  stripeFeePct: number;     // % of gross
  stripeFeeFlat: number;    // $ per Stripe charge
  fixedMonthly: number;     // hosting + misc fixed costs
  horizon: number;          // projection length in months
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  unit: 'one-time' | 'monthly';
  buyersPerMonth: number;
}

export interface MonthResult {
  firms: number;
  cheques: number;
  overageCheques: number;
  subscription: number;
  overage: number;
  addOns: number;
  gross: number;
  processingCost: number;
  stripeCost: number;
  cost: number;
  profit: number;
}

// Exported for scripts/check-profit-model.ts. This is the only arithmetic on
// the page and the owner makes pricing decisions from it, so it gets a check
// that fails if the money moves.
export function monthAt(inputs: CalcInputs, services: ServiceItem[], factor: number): MonthResult {
  let firms = 0;
  let cheques = 0;
  let overageCheques = 0;
  let subscription = 0;
  // Stripe takes its flat fee per charge: a monthly firm is charged every
  // month, an annual firm once a year (1/12 of a charge per month). Overage
  // rides the same invoice, so it adds no charge.
  let charges = 0;

  for (const t of inputs.tiers) {
    const m = (t.monthlyFirms || 0) * factor;
    const a = (t.annualFirms || 0) * factor;
    const n = m + a;
    firms += n;
    subscription += m * (t.monthlyPrice || 0) + a * ((t.annualPrice || 0) / 12);
    charges += m + a / 12;
    cheques += n * (t.chequesPerFirm || 0);
    overageCheques += n * Math.max(0, (t.chequesPerFirm || 0) - (t.allowance || 0));
  }

  const overage = overageCheques * inputs.overageRate;
  const addOnBuyers = services.reduce((s, x) => s + (x.buyersPerMonth || 0) * factor, 0);
  const addOns = services.reduce((s, x) => s + (x.price || 0) * (x.buyersPerMonth || 0) * factor, 0);
  charges += addOnBuyers;

  const gross = subscription + overage + addOns;
  const processingCost = cheques * inputs.costPerCheque;
  const stripeCost = gross * (inputs.stripeFeePct / 100) + charges * inputs.stripeFeeFlat;
  const cost = processingCost + stripeCost + inputs.fixedMonthly;

  return {
    firms, cheques, overageCheques, subscription, overage, addOns, gross,
    processingCost, stripeCost, cost, profit: gross - cost,
  };
}
