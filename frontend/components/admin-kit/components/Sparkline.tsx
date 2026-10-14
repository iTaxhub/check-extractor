'use client';
import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { CHART_COLORS, NO_TWEEN } from "@/lib/charts";

interface SparklineProps {
  data: number[];
  color?: string;
  positive?: boolean;
  negative?: boolean;
}

export function Sparkline({ data, color, positive, negative }: SparklineProps) {
  // positive/negative are semantic (a trend that is good or bad), so they take
  // the success/error tokens, not a categorical slot. Neutral falls back to brand.
  const resolvedColor =
    color ??
    (positive
      ? CHART_COLORS.emerald
      : negative
        ? CHART_COLORS.error
        : CHART_COLORS.brand);
  const chartData = data.map((v) => ({ v }));

  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={chartData}>
        <Line {...NO_TWEEN}
          type="monotone"
          dataKey="v"
          stroke={resolvedColor}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
