'use client';
import React from "react";
import { PageHeader } from "../components/PageHeader";
import { ChartCard } from "../components/ChartCard";
import { EmptyState } from "../components/EmptyState";
import { KpiTile } from "../components/KpiTile";
import { useAdminMetrics } from "../lib/queries";
import { formatNumber } from "../lib/formatters";

// DepthMe's growth page read push_subscriptions, feedback and
// user_profiles.heard_about. None exist in Kyriq, so it now shows the
// acquisition numbers admin-metrics already returns.
export default function GrowthPage() {
  const { data, isLoading } = useAdminMetrics();
  const conv = data?.trialConversionRate;

  return (
    <div className="space-y-8">
      <PageHeader title="Growth" description="Signups, trials and conversion across firms" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile label="New signups" value={data ? formatNumber(data.newSignups) : "-"} loading={isLoading} />
        <KpiTile label="Total users" value={data ? formatNumber(data.totalUsers) : "-"} loading={isLoading} />
        <KpiTile label="Trial → paid" value={conv == null ? "-" : `${Math.round(conv * 100)}%`} loading={isLoading} />
      </div>

      <ChartCard title="Acquisition channels" description="Where new firms come from">
        <EmptyState
          title="Not tracked yet"
          description="Kyriq does not record an acquisition source at signup, so there is nothing to break down here."
        />
      </ChartCard>
    </div>
  );
}
