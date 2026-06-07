"use client";

import { useRef } from "react";
import { CalculationResult, CalculatorInputs } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, FileText, Lightbulb, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { generatePDF } from "@/lib/pdf-generator";

interface Props {
  result: CalculationResult;
  inputs: CalculatorInputs;
}

export default function DetailedReport({ result, inputs }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (reportRef.current) {
      await generatePDF(reportRef.current, `php-worker-report-${inputs.domain}.pdf`);
    }
  };

  const capacityData = [
    { name: "Current", value: inputs.monthlyPageviews, color: "#3b82f6" },
    { name: "Capacity", value: result.maxMonthlyPageviews, color: "#10b981" },
    { name: "2× Traffic", value: inputs.monthlyPageviews * 2, color: "#f59e0b" },
    { name: "5× Traffic", value: inputs.monthlyPageviews * 5, color: "#ef4444" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detailed Report</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Deep dive into your worker calculation</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 transition-all hover:shadow-lg active:scale-95"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      <div ref={reportRef} className="space-y-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
        {/* Worker Breakdown Chart */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-blue-500" />
            Worker Allocation Breakdown
          </h3>
          <div className="h-72 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.breakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="label" type="category" width={130} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip
                  formatter={(value: any) => [`${value} workers`, ""]}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="workers" radius={[0, 8, 8, 0]} barSize={24}>
                  {result.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Chart */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-6 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Traffic Capacity vs. Current Load
          </h3>
          <div className="h-72 rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityData} margin={{ left: 20, right: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: any) => [formatNumber(value) + " pageviews/mo", ""]}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={48}>
                  {capacityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Input Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Traffic
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Monthly Pageviews</span>
                <span className="font-bold text-slate-900 dark:text-white">{inputs.monthlyPageviews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Unique Visitors</span>
                <span className="font-bold text-slate-900 dark:text-white">{inputs.monthlyUniqueVisitors.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Pages/Session</span>
                <span className="font-bold text-slate-900 dark:text-white">{inputs.pagesPerSession}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 dark:text-slate-400">Peak Concurrent</span>
                <span className="font-bold text-slate-900 dark:text-white">{inputs.peakConcurrentUsers ?? "Auto-estimated"}</span>
              </div>
            </div>
          </div>
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              Configuration
            </h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Site Type</span>
                <span className="font-bold capitalize text-slate-900 dark:text-white">{inputs.siteType}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Dynamic Content</span>
                <span className="font-bold text-slate-900 dark:text-white">{inputs.dynamicContentPercent}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700">
                <span className="text-slate-600 dark:text-slate-400">Logged-in Traffic</span>
                <span className="font-bold text-slate-900 dark:text-white">{inputs.loggedInTrafficPercent}%</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-600 dark:text-slate-400">Object Cache</span>
                <span className="font-bold capitalize text-slate-900 dark:text-white">{inputs.objectCacheEnabled}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Optimization Tips */}
        <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800/50 p-6">
          <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-4 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Optimization Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {result.optimizationTips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-amber-900 dark:text-amber-200 bg-white/60 dark:bg-slate-900/40 rounded-xl p-4">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                {tip}
              </div>
            ))}
          </div>
        </div>

        {/* Projections */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-6">
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-5 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            Traffic Growth Projections
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "2× Traffic", value: result.projections.traffic2x, desc: "workers needed" },
              { label: "5× Traffic", value: result.projections.traffic5x, desc: "workers needed" },
              { label: "10× Traffic", value: result.projections.traffic10x, desc: "workers needed" },
            ].map((proj) => (
              <div key={proj.label} className="text-center p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2">{proj.label}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{proj.value}</p>
                <p className="text-xs text-slate-400 mt-1">{proj.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Warning */}
        {inputs.currentWorkerLimit && inputs.currentWorkerLimit < result.recommendedWorkers && (
          <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800 dark:text-red-300">Under-provisioned Warning</p>
                <p className="text-sm text-red-700 dark:text-red-200 mt-1">
                  Your current host provides <strong>{inputs.currentWorkerLimit}</strong> workers, but you need <strong>{result.recommendedWorkers}</strong>.
                  You are <strong>{result.recommendedWorkers - inputs.currentWorkerLimit}</strong> workers short during peak traffic.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
