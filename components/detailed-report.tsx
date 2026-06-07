"use client";

import { useRef } from "react";
import { CalculationResult, CalculatorInputs } from "@/types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Download, FileText, TrendingUp, Users } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { generatePDF } from "@/lib/pdf-generator";

interface Props {
  result: CalculationResult;
  inputs: CalculatorInputs;
}

const CHART_COLORS = ["#0a0a0a", "#525252", "#737373", "#a3a3a3", "#d4d4d4", "#e5e5e5", "#f0f0f0", "#fafafa", "#ffffff"];

export default function DetailedReport({ result, inputs }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (reportRef.current) {
      await generatePDF(reportRef.current, `php-worker-report-${inputs.domain}.pdf`);
    }
  };

  const capacityData = [
    { name: "Current", value: inputs.monthlyPageviews },
    { name: "Capacity", value: result.maxMonthlyPageviews },
    { name: "2× Traffic", value: inputs.monthlyPageviews * 2 },
    { name: "5× Traffic", value: inputs.monthlyPageviews * 5 },
  ];

  const isDark = typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const tickColor = isDark ? "#a3a3a3" : "#737373";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl font-medium tracking-tight">Detailed report</h3>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium tracking-wide uppercase border transition-colors"
          style={{
            borderColor: "var(--color-border-strong)",
            color: "var(--color-fg)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)";
          }}
        >
          <Download className="w-3.5 h-3.5" />
          Export PDF
        </button>
      </div>

      <div ref={reportRef} className="space-y-12 border p-8 md:p-10" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
        {/* Worker Breakdown Chart */}
        <div>
          <h4 className="text-xs font-medium tracking-widest uppercase mb-6" style={{ color: "var(--color-fg-muted)" }}>
            Worker allocation
          </h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={result.breakdown} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={130}
                  tick={{ fontSize: 12, fill: tickColor }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => [`${value} workers`, ""]}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: 0,
                    boxShadow: "none",
                    color: "var(--color-fg)",
                  }}
                />
                <Bar dataKey="workers" barSize={20}>
                  {result.breakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Capacity Chart */}
        <div className="border-t pt-10" style={{ borderColor: "var(--color-border)" }}>
          <h4 className="text-xs font-medium tracking-widest uppercase mb-6" style={{ color: "var(--color-fg-muted)" }}>
            Traffic capacity
          </h4>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={capacityData} margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: any) => [formatNumber(value) + " pageviews/mo", ""]}
                  contentStyle={{
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border-strong)",
                    borderRadius: 0,
                    boxShadow: "none",
                    color: "var(--color-fg)",
                  }}
                />
                <Bar dataKey="value" barSize={48}>
                  {capacityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Input Summary */}
        <div className="border-t pt-10 grid grid-cols-1 md:grid-cols-2 gap-8" style={{ borderColor: "var(--color-border)" }}>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Traffic
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: "Monthly pageviews", value: inputs.monthlyPageviews.toLocaleString() },
                { label: "Unique visitors", value: inputs.monthlyUniqueVisitors.toLocaleString() },
                { label: "Pages/session", value: inputs.pagesPerSession.toString() },
                { label: "Peak concurrent", value: inputs.peakConcurrentUsers?.toString() ?? "Auto" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-baseline py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <span style={{ color: "var(--color-fg-secondary)" }}>{row.label}</span>
                  <span className="font-mono font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Configuration
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: "Site type", value: inputs.siteType },
                { label: "Dynamic content", value: `${inputs.dynamicContentPercent}%` },
                { label: "Logged-in traffic", value: `${inputs.loggedInTrafficPercent}%` },
                { label: "Object cache", value: inputs.objectCacheEnabled },
                { label: "CDN", value: inputs.cdnEnabled },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-baseline py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
                  <span style={{ color: "var(--color-fg-secondary)" }}>{row.label}</span>
                  <span className="font-mono font-medium capitalize">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projections */}
        <div className="border-t pt-10" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
              Growth projections
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "2× Traffic", value: result.projections.traffic2x },
              { label: "5× Traffic", value: result.projections.traffic5x },
              { label: "10× Traffic", value: result.projections.traffic10x },
            ].map((proj) => (
              <div
                key={proj.label}
                className="text-center p-6 border"
                style={{ borderColor: "var(--color-border)" }}
              >
                <p className="text-xs mb-2" style={{ color: "var(--color-fg-muted)" }}>{proj.label}</p>
                <p className="font-display text-3xl font-medium tracking-tight">{proj.value}</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-fg-muted)" }}>workers</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
