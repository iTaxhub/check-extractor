/**
 * Self-check for the admin Profit Calculator's arithmetic.
 *
 *   cd frontend && npx tsx scripts/check-profit-model.ts
 *
 * No test framework on purpose, like every other check in this folder.
 *
 * WHY THIS EXISTS: this page used to model a different product entirely. It was
 * ported from DepthMe and kept DepthMe's $14.99/month consumer prices, so the
 * admin console was out by roughly 17x against Kyriq's $249-$1,299 plans, and it
 * had no concept of the cheque allowance or the overage rate — which between
 * them are most of Kyriq's unit economics. Nothing caught that, because there
 * was nothing checking what the numbers meant.
 *
 * `monthAt()` is now the only arithmetic on the page: the KPIs, the projection
 * table and the chart all read from it, so they cannot disagree with each other
 * — but they can all be wrong together. These are hand-computed expectations.
 * If someone changes the model, this fails and says which figure moved.
 */
import assert from 'node:assert/strict';
import { monthAt, type CalcInputs, type ServiceItem } from '../components/admin-kit/lib/profit-model';
import { PLANS, OVERAGE_USD_PER_CHECK, STRIPE_FEE_PCT, STRIPE_FEE_FLAT_USD } from '../lib/pricing';

const near = (actual: number, expected: number, what: string, tol = 0.005) =>
  assert.ok(
    Math.abs(actual - expected) < tol,
    `${what}: expected ${expected.toFixed(4)}, got ${actual.toFixed(4)}`
  );

const NO_SERVICES: ServiceItem[] = [];

/* --- 1. One Professional firm, billed monthly, inside its allowance ------ */
// The simplest case, and the one every other figure builds on.
{
  const pro = PLANS.find((p) => p.tier === 'professional')!;
  const inputs: CalcInputs = {
    tiers: [{
      tier: pro.tier, name: pro.name,
      monthlyPrice: pro.monthly, annualPrice: pro.annual, allowance: pro.allowance,
      monthlyFirms: 1, annualFirms: 0,
      chequesPerFirm: pro.allowance,   // exactly at the allowance => no overage
    }],
    growthPct: 0, churnPct: 0,
    overageRate: OVERAGE_USD_PER_CHECK,
    costPerCheque: 0.01,
    stripeFeePct: STRIPE_FEE_PCT,
    stripeFeeFlat: STRIPE_FEE_FLAT_USD,
    fixedMonthly: 0,
    horizon: 12,
  };
  const r = monthAt(inputs, NO_SERVICES, 1);

  near(r.subscription, 649, 'Professional monthly subscription');
  near(r.overage, 0, 'at the allowance there must be no overage');
  near(r.gross, 649, 'gross');
  near(r.cheques, 4500, 'cheques processed');
  near(r.processingCost, 45, 'processing cost (4500 x $0.01)');
  // 649 * 2.9% = 18.821, plus one flat 30c charge.
  near(r.stripeCost, 649 * 0.029 + 0.3, 'Stripe cost: percentage plus ONE flat fee');
  near(r.profit, 649 - 45 - (649 * 0.029 + 0.3), 'profit');
}

/* --- 2. Overage is charged only above the allowance --------------------- */
// The old model had no overage at all; this is the figure it was missing.
{
  const starter = PLANS.find((p) => p.tier === 'essential')!;
  const over = 500;
  const inputs: CalcInputs = {
    tiers: [{
      tier: starter.tier, name: starter.name,
      monthlyPrice: starter.monthly, annualPrice: starter.annual, allowance: starter.allowance,
      monthlyFirms: 2, annualFirms: 0,
      chequesPerFirm: starter.allowance + over,
    }],
    growthPct: 0, churnPct: 0,
    overageRate: OVERAGE_USD_PER_CHECK,
    costPerCheque: 0,
    stripeFeePct: 0, stripeFeeFlat: 0, fixedMonthly: 0, horizon: 12,
  };
  const r = monthAt(inputs, NO_SERVICES, 1);

  near(r.overageCheques, 2 * over, 'only the cheques ABOVE the allowance count');
  near(r.overage, 2 * over * 0.2, 'overage revenue at $0.20/cheque');
  near(r.subscription, 2 * 249, 'two Starter firms');
  near(r.gross, 2 * 249 + 2 * over * 0.2, 'gross includes overage');
  // Billed on cheques PROCESSED, not on the billable overage: the included ones
  // still cost money to run. Getting this backwards would overstate margin.
  near(r.cheques, 2 * (starter.allowance + over), 'processing covers every cheque, not just overage');
}

/* --- 3. An annual firm is one Stripe charge a year, not twelve ---------- */
// Billing an annual firm a flat fee every month overstates costs ~12x on this
// line. The model spreads it, so the per-month figure is 1/12 of a charge.
{
  const firm = PLANS.find((p) => p.tier === 'scale')!;
  const base = {
    tier: firm.tier, name: firm.name,
    monthlyPrice: firm.monthly, annualPrice: firm.annual, allowance: firm.allowance,
    chequesPerFirm: 0,
  };
  const common = {
    growthPct: 0, churnPct: 0, overageRate: 0, costPerCheque: 0,
    stripeFeePct: 0, stripeFeeFlat: 0.3, fixedMonthly: 0, horizon: 12,
  };

  const monthly = monthAt({ ...common, tiers: [{ ...base, monthlyFirms: 12, annualFirms: 0 }] }, NO_SERVICES, 1);
  const annual = monthAt({ ...common, tiers: [{ ...base, monthlyFirms: 0, annualFirms: 12 }] }, NO_SERVICES, 1);

  near(monthly.stripeCost, 12 * 0.3, '12 monthly firms = 12 flat fees');
  near(annual.stripeCost, 0.3, '12 annual firms = 1 flat fee per month (12/12)');

  // And the annual plan is recognised at a twelfth of its yearly price.
  near(annual.subscription, 12 * (firm.annual / 12), 'annual revenue spread across the year');
}

/* --- 4. Growth factor scales firms, and profit follows ------------------ */
// `factor` is how the projection compounds; the chart and table both pass it.
{
  const pro = PLANS.find((p) => p.tier === 'professional')!;
  const inputs: CalcInputs = {
    tiers: [{
      tier: pro.tier, name: pro.name,
      monthlyPrice: pro.monthly, annualPrice: pro.annual, allowance: pro.allowance,
      monthlyFirms: 10, annualFirms: 0, chequesPerFirm: 0,
    }],
    growthPct: 0, churnPct: 0, overageRate: 0, costPerCheque: 0,
    stripeFeePct: 0, stripeFeeFlat: 0, fixedMonthly: 1000, horizon: 12,
  };
  const one = monthAt(inputs, NO_SERVICES, 1);
  const two = monthAt(inputs, NO_SERVICES, 2);

  near(two.firms, 2 * one.firms, 'doubling the factor doubles the firms');
  near(two.gross, 2 * one.gross, 'and doubles gross');
  // Fixed cost must NOT scale with the factor — that is the point of it.
  near(two.cost - two.gross * 0, 2 * one.processingCost + 1000, 'fixed cost stays fixed as the business grows');
}

/* --- 5. A loss is reported as a loss ------------------------------------ */
// Guards the sign: a model that cannot go negative cannot show break-even.
{
  const pro = PLANS.find((p) => p.tier === 'professional')!;
  const r = monthAt({
    tiers: [{
      tier: pro.tier, name: pro.name,
      monthlyPrice: pro.monthly, annualPrice: pro.annual, allowance: pro.allowance,
      monthlyFirms: 1, annualFirms: 0, chequesPerFirm: 0,
    }],
    growthPct: 0, churnPct: 0, overageRate: 0, costPerCheque: 0,
    stripeFeePct: 0, stripeFeeFlat: 0, fixedMonthly: 10_000, horizon: 12,
  }, NO_SERVICES, 1);

  assert.ok(r.profit < 0, 'one firm against $10k of fixed cost must be a loss');
  near(r.profit, 649 - 10_000, 'and the loss is exactly the shortfall');
}

/* --- 6. The seeded prices are Kyriq's, not another product's ------------ */
// The defect this page actually shipped with.
{
  const monthlies = PLANS.map((p) => p.monthly).sort((a, b) => a - b);
  assert.deepEqual(monthlies, [249, 649, 1299], 'lib/pricing.ts no longer holds Kyriq plan prices');
  assert.ok(
    !PLANS.some((p) => p.monthly < 100),
    'a sub-$100 plan appeared — that was the DepthMe consumer price the calculator used to model'
  );
}

console.log('  ok  subscription, overage, processing cost and Stripe fees');
console.log('  ok  annual firms are charged once a year, not twelve times');
console.log('  ok  growth scales firms but not fixed cost; losses stay negative');
console.log('  ok  the model is seeded with Kyriq prices');
console.log('\nall profit-model checks passed');
