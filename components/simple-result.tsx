"use client";

import { CalculationResult, CalculatorInputs } from "@/types";
import { Users, TrendingUp, Zap, ArrowUpRight, CheckCircle2, Layers } from "lucide-react";
import { formatNumber } from "@/lib/utils";

interface Props {
  result: CalculationResult;
  inputs: CalculatorInputs;
}

export default function SimpleResult({ result, inputs }: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/30 via-transparent to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-500/10 blur-[80px] rounded-full" />

      <div className="relative p-8 md:p-12">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-emerald-400 uppercase tracking-wider">Result</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <div className="space-y-6">
            <div>
              <p className="text-slate-400 text-sm font-medium mb-2">Recommended PHP Workers</p>
              <div className="flex items-baseline gap-4">
                <span className="text-7xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
                  {result.recommendedWorkers}
                </span>
                <span className="text-xl text-slate-400 font-medium">workers</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium">
                <Layers className="w-4 h-4 text-blue-400" />
                {result.tier} Tier
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium">
                <Zap className="w-4 h-4 text-amber-400" />
                {formatNumber(result.maxMonthlyPageviews)} pageviews/mo capacity
              </div>
            </div>

            <p className="text-slate-400 text-base leading-relaxed max-w-lg">
              For a <span className="text-white font-semibold capitalize">{inputs.siteType}</span> site
              with <span className="text-white font-semibold">{formatNumber(inputs.monthlyPageviews)}</span> monthly pageviews,
              {result.recommendedWorkers} workers handle your traffic comfortably with headroom for spikes.
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[240px]">
            <MetricCard
              icon={<Users className="w-4 h-4 text-blue-400" />}
              label="Max Concurrent Users"
              value={formatNumber(result.maxConcurrentUsers)}
            />
            <MetricCard
              icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
              label="Monthly Capacity"
              value={formatNumber(result.maxMonthlyPageviews)}
            />
            <MetricCard
              icon={<ArrowUpRight className="w-4 h-4 text-violet-400" />}
              label="2× Traffic Needs"
              value={`${result.projections.traffic2x} workers`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-center gap-2 text-slate-400 text-xs font-medium mb-1.5">
        {icon}
        {label}
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
