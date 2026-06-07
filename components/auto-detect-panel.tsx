"use client";

import { DetectedTech } from "@/types";
import { Cpu, Layers, Gauge, FileText, Shield, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  detected: DetectedTech;
}

function DetectionCard({
  icon,
  title,
  children,
  active,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-300 ${
        active
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/40 dark:shadow-none"
          : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
        {active && <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />}
        {!active && <XCircle className="w-4 h-4 text-slate-300 ml-auto" />}
      </div>
      {children}
    </div>
  );
}

function Badge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
        active
          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-800"
          : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border border-slate-200 dark:border-slate-700"
      }`}
    >
      {label}
    </span>
  );
}

export default function AutoDetectPanel({ detected }: Props) {
  const anyDetected =
    detected.isWordPress ||
    detected.hasWooCommerce ||
    detected.hasElementor ||
    detected.estimatedPages > 0 ||
    detected.ttfb !== null;

  if (!anyDetected) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-10 text-center">
        <Cpu className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No data detected yet. Enter a domain above and click Analyze, or skip and fill the form manually.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
          <Cpu className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detected Tech Stack</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Auto-populated from your site. Review and adjust below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DetectionCard
          icon={<Layers className="w-4 h-4 text-blue-500" />}
          title="CMS & Builder"
          active={detected.isWordPress || detected.hasWooCommerce || detected.hasElementor}
        >
          <div className="flex flex-wrap gap-2">
            <Badge active={detected.isWordPress} label="WordPress" />
            <Badge active={detected.hasWooCommerce} label="WooCommerce" />
            <Badge active={detected.hasElementor} label="Elementor" />
          </div>
        </DetectionCard>

        <DetectionCard
          icon={<Shield className="w-4 h-4 text-emerald-500" />}
          title="Membership & Forms"
          active={detected.hasMemberPress || detected.hasLearnDash || detected.hasBuddyBoss || detected.hasGravityForms}
        >
          <div className="flex flex-wrap gap-2">
            <Badge active={detected.hasMemberPress} label="MemberPress" />
            <Badge active={detected.hasLearnDash} label="LearnDash" />
            <Badge active={detected.hasBuddyBoss} label="BuddyBoss" />
            <Badge active={detected.hasGravityForms} label="Gravity Forms" />
            <Badge active={detected.hasContactForm7} label="CF7" />
          </div>
        </DetectionCard>

        <DetectionCard
          icon={<Gauge className="w-4 h-4 text-amber-500" />}
          title="Performance"
          active={!!detected.cachePlugin || detected.hasWPRocket || detected.hasCloudflare}
        >
          <div className="flex flex-wrap gap-2">
            <Badge active={!!detected.cachePlugin} label={detected.cachePlugin || "No Cache"} />
            <Badge active={detected.hasWPRocket} label="WP Rocket" />
            <Badge active={detected.hasLiteSpeedCache} label="LiteSpeed" />
            <Badge active={detected.hasCloudflare} label="Cloudflare" />
          </div>
        </DetectionCard>

        <DetectionCard
          icon={<FileText className="w-4 h-4 text-sky-500" />}
          title="Site Scale"
          active={detected.estimatedPages > 0 || detected.heavyPluginsCount > 0}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Pages</span>
              <span className="font-bold text-slate-900 dark:text-white">{detected.estimatedPages.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">Heavy plugins</span>
              <span className="font-bold text-slate-900 dark:text-white">{detected.heavyPluginsCount}</span>
            </div>
          </div>
        </DetectionCard>

        <DetectionCard
          icon={<Gauge className="w-4 h-4 text-rose-500" />}
          title="Core Web Vitals"
          active={detected.ttfb !== null || detected.lcp !== null}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">TTFB</span>
              <span className={`font-bold ${detected.ttfb && detected.ttfb > 800 ? "text-red-500" : "text-slate-900 dark:text-white"}`}>
                {detected.ttfb ? `${detected.ttfb}ms` : "N/A"}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">LCP</span>
              <span className="font-bold text-slate-900 dark:text-white">{detected.lcp ? `${detected.lcp}ms` : "N/A"}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">CLS</span>
              <span className="font-bold text-slate-900 dark:text-white">{detected.cls ?? "N/A"}</span>
            </div>
          </div>
        </DetectionCard>
      </div>
    </div>
  );
}
