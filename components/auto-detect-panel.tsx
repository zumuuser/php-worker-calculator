"use client";

import { DetectedTech, ScanStatus, DnsInfo } from "@/types";
import { Check, X, Globe, Zap, Box, Shield, AlertCircle, Wifi, Server, Mail, MapPin, Layers, Code, Monitor } from "lucide-react";

interface Props {
  detected: DetectedTech;
  domain: string;
  status: ScanStatus;
  dns: DnsInfo;
}

const CATEGORY_LABELS: Record<string, string> = {
  ecommerce: "E-commerce",
  seo: "SEO",
  cache: "Cache",
  security: "Security",
  forms: "Forms",
  "page-builder": "Page Builder",
  membership: "Membership",
  lms: "LMS",
  backup: "Backup",
  analytics: "Analytics",
  other: "Other",
};

export default function AutoDetectPanel({ detected, domain, status, dns }: Props) {
  const allFailed = !status.homepageFetched && !status.pageSpeedFetched && !status.dnsFetched;
  const pluginsByCategory = detected.plugins.reduce((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {} as Record<string, typeof detected.plugins>);

  return (
    <div className="animate-fade-up space-y-8">
      {/* Scan status */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs" style={{ color: "var(--color-fg-muted)" }}>
        <ScanBadge ok={status.dnsFetched} label="DNS" />
        <ScanBadge ok={status.homepageFetched} label="Homepage" />
        <ScanBadge ok={status.sitemapFetched} label="Sitemap" />
        <ScanBadge ok={status.pageSpeedFetched} label="PageSpeed" />
        {status.proxyUsed && (
          <span className="inline-flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Via {status.proxyUsed.startsWith("http") ? new URL(status.proxyUsed).hostname : status.proxyUsed}
          </span>
        )}
      </div>

      {allFailed && (
        <div className="flex items-start gap-3 p-4 border" style={{ borderColor: "var(--color-warn)", background: "rgba(202,138,4,0.04)" }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-warn)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-warn)" }}>Could not fetch site data</p>
            <p className="text-sm mt-1" style={{ color: "var(--color-fg-secondary)" }}>
              The site blocks cross-origin requests. DNS detection below still works. Please refine the calculation manually.
            </p>
          </div>
        </div>
      )}

      {/* System Info Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SystemInfo label="CMS" value={detected.cms || "—"} sub={detected.cmsVersion || undefined} icon={<Monitor className="w-4 h-4" />} />
        <SystemInfo label="PHP" value={detected.phpVersion || "—"} icon={<Code className="w-4 h-4" />} />
        <SystemInfo label="Theme" value={detected.theme || "—"} icon={<Layers className="w-4 h-4" />} />
        <SystemInfo label="Server" value={detected.serverSoftware || dns.hostingProvider || "—"} icon={<Server className="w-4 h-4" />} />
      </div>

      <div className="border-t grid grid-cols-1 lg:grid-cols-3 gap-0" style={{ borderColor: "var(--color-border)" }}>
        {/* Plugins */}
        <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r p-6 space-y-6" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Detected plugins
              </span>
            </div>
            <span className="text-xs font-mono" style={{ color: "var(--color-fg-muted)" }}>
              {detected.plugins.length} found
            </span>
          </div>

          {detected.plugins.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
              {status.homepageFetched
                ? "No WordPress plugins detected. This may be a non-WordPress site or plugins are loaded dynamically."
                : "Could not scan for plugins — site blocked our fetch requests."}
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(pluginsByCategory).map(([category, plugins]) => (
                <div key={category}>
                  <p className="text-xs font-medium tracking-widest uppercase mb-2" style={{ color: "var(--color-fg-muted)" }}>
                    {CATEGORY_LABELS[category] || category} ({plugins.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plugins.map((p) => (
                      <span
                        key={p.slug}
                        className="px-3 py-1.5 text-xs font-medium"
                        style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}
                        title={p.slug}
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Frameworks */}
          {detected.frameworks.length > 0 && (
            <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
                <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Frameworks</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {detected.frameworks.map((fw) => (
                  <span key={fw} className="px-3 py-1.5 text-xs font-medium" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>{fw}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Infrastructure & Performance */}
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Infrastructure</span>
            </div>
            <div className="space-y-3 text-sm">
              <DnsRow label="Hosting" value={dns.hostingProvider} icon={<Server className="w-3.5 h-3.5" />} />
              <DnsRow label="CDN" value={dns.cdnProvider} icon={<MapPin className="w-3.5 h-3.5" />} />
              <DnsRow label="Email" value={dns.emailProvider} icon={<Mail className="w-3.5 h-3.5" />} />
              {dns.nameservers.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs mb-1" style={{ color: "var(--color-fg-muted)" }}>Nameservers:</p>
                  <div className="flex flex-wrap gap-1">
                    {dns.nameservers.slice(0, 3).map((ns) => (
                      <span key={ns} className="text-xs font-mono px-1.5 py-0.5" style={{ background: "var(--color-surface-raised)" }}>{ns.replace(/\.$/, "")}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Site scale</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-baseline">
                <span style={{ color: "var(--color-fg-secondary)" }}>Estimated pages</span>
                <span className="font-medium font-mono">{status.sitemapFetched ? detected.estimatedPages.toLocaleString() : "—"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span style={{ color: "var(--color-fg-secondary)" }}>Heavy plugins</span>
                <span className="font-medium font-mono">{detected.heavyPluginsCount}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Performance</span>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-baseline">
                <span style={{ color: "var(--color-fg-secondary)" }}>TTFB</span>
                <span className="font-medium font-mono">{status.pageSpeedFetched && detected.ttfb ? `${detected.ttfb}ms` : status.pageSpeedRateLimited ? "Rate limited" : "—"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span style={{ color: "var(--color-fg-secondary)" }}>LCP</span>
                <span className="font-medium font-mono">{status.pageSpeedFetched && detected.lcp ? `${detected.lcp}ms` : "—"}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span style={{ color: "var(--color-fg-secondary)" }}>CLS</span>
                <span className="font-medium font-mono">{status.pageSpeedFetched && detected.cls !== null ? detected.cls : "—"}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Caching</span>
            </div>
            <p className="text-sm font-medium">
              {detected.cachePlugin || (status.homepageFetched ? "No cache plugin detected" : "Could not scan")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScanBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {ok ? <Check className="w-3 h-3" style={{ color: "var(--color-success)" }} strokeWidth={3} /> : <X className="w-3 h-3" style={{ color: "var(--color-fg-muted)" }} strokeWidth={3} />}
      {label}
    </span>
  );
}

function DnsRow({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5" style={{ color: "var(--color-fg-secondary)" }}>{icon}{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}

function SystemInfo({ label, value, sub, icon }: { label: string; value: string; sub?: string; icon: React.ReactNode }) {
  return (
    <div className="p-4 border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: "var(--color-fg-muted)" }}>
        {icon}
        <span className="text-xs font-medium tracking-widest uppercase">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{value}</p>
      {sub && <p className="text-xs font-mono mt-1" style={{ color: "var(--color-fg-muted)" }}>{sub}</p>}
    </div>
  );
}
