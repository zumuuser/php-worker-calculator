"use client";

import { CalculationResult, CalculatorInputs } from "@/types";
import { formatNumber } from "@/lib/utils";
import { Users, TrendingUp, ArrowUpRight, AlertTriangle } from "lucide-react";

interface Props {
  result: CalculationResult;
  inputs: CalculatorInputs;
}

export default function SimpleResult({ result, inputs }: Props) {
  const currentLimit = inputs.currentWorkerLimit;
  const isUnderProvisioned = currentLimit && currentLimit < result.recommendedWorkers;

  return (
    <div
      className="border"
      style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
    >
      {/* Main number */}
      <div className="p-8 md:p-12 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-muted)" }}>
              Recommended PHP workers
            </p>
            <div className="flex items-baseline gap-4">
              <span className="font-display text-7xl md:text-9xl font-medium tracking-tighter">
                {result.recommendedWorkers}
              </span>
              <span className="text-lg font-medium" style={{ color: "var(--color-fg-secondary)" }}>
                workers
              </span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase"
                style={{
                  background: "var(--color-fg)",
                  color: "var(--color-bg)",
                }}
              >
                {result.tier}
              </span>
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase border"
                style={{ borderColor: "var(--color-border-strong)" }}
              >
                {formatNumber(result.maxMonthlyPageviews)} pageviews/mo capacity
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 lg:min-w-[200px]">
            <MetricRow label="Max concurrent" value={formatNumber(result.maxConcurrentUsers)} icon={<Users className="w-3.5 h-3.5" />} />
            <MetricRow label="Monthly capacity" value={formatNumber(result.maxMonthlyPageviews)} icon={<TrendingUp className="w-3.5 h-3.5" />} />
            <MetricRow label="2× traffic needs" value={`${result.projections.traffic2x} workers`} icon={<ArrowUpRight className="w-3.5 h-3.5" />} />
            <MetricRow label="5× traffic needs" value={`${result.projections.traffic5x} workers`} icon={<ArrowUpRight className="w-3.5 h-3.5" />} />
          </div>
        </div>
      </div>

      {/* Breakdown */}
      <div className="p-8 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-muted)" }}>
            Worker breakdown
          </p>
          <div className="space-y-2">
            {result.breakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div
                  className="w-2 h-2 shrink-0"
                  style={{ background: item.color }}
                />
                <span className="text-sm flex-1" style={{ color: "var(--color-fg-secondary)" }}>
                  {item.label}
                </span>
                <span className="text-sm font-mono font-medium">{item.workers}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-muted)" }}>
            Optimization tips
          </p>
          <div className="space-y-3">
            {result.optimizationTips.slice(0, 5).map((tip, i) => (
              <p key={i} className="text-sm leading-relaxed" style={{ color: "var(--color-fg-secondary)" }}>
                {tip}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Under-provisioned warning */}
      {isUnderProvisioned && currentLimit && (
        <div
          className="px-8 md:px-12 py-6 border-t flex items-start gap-3"
          style={{
            borderColor: "var(--color-danger)",
            background: "rgba(220, 38, 38, 0.04)",
          }}
        >
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-danger)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-danger)" }}>
              Under-provisioned
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-fg-secondary)" }}>
              Your current host provides <strong>{currentLimit}</strong> workers, but you need <strong>{result.recommendedWorkers}</strong>.
              You are <strong>{result.recommendedWorkers - currentLimit}</strong> workers short.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2" style={{ color: "var(--color-fg-muted)" }}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-mono font-medium">{value}</span>
    </div>
  );
}
