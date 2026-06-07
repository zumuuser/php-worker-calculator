"use client";

import { DetectedTech, ScanStatus, DnsInfo } from "@/types";
import { Check, X, Globe, Zap, Box, Shield, AlertCircle, Wifi, Server, Mail, MapPin, Layers, Code, Monitor, FileText, Tag, BarChart3 } from "lucide-react";

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

  const hasAnyPlugins = detected.plugins.length > 0;
  const hasAnyScripts = detected.scripts.length > 0;
  const hasAnyAnalytics = detected.analytics.length > 0;
  const hasMetaDescription = !!detected.metaDescription;
  const hasInterestingHeaders = Object.keys(detected.responseHeaders).length > 0;
  const hasPerformanceData = status.pageSpeedFetched && (detected.ttfb !== null || detected.lcp !== null || detected.cls !== null);

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
        <SystemInfo label="CMS" value={detected.cms} sub={detected.cmsVersion || undefined} icon={<Monitor className="w-4 h-4" />} />
        <SystemInfo label="PHP" value={detected.phpVersion} fallback={detected.isPhpSite ? "Not detected" : "Not applicable"} icon={<Code className="w-4 h-4" />} />
        <SystemInfo label="Theme" value={detected.theme} fallback={detected.isWordPress ? "Not detected" : "Not applicable"} icon={<Layers className="w-4 h-4" />} />
        <SystemInfo label="Server" value={detected.serverSoftware || dns.hostingProvider} fallback="Not detected" icon={<Server className="w-4 h-4" />} />
      </div>

      {/* Meta description if available */}
      {hasMetaDescription && (
        <div className="p-4 border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: "var(--color-fg-muted)" }}>
            <FileText className="w-3.5 h-3.5" />
            <span className="text-xs font-medium tracking-widest uppercase">Meta description</span>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-fg-secondary)" }}>
            {detected.metaDescription}
          </p>
        </div>
      )}

      <div className="border-t grid grid-cols-1 lg:grid-cols-3 gap-0" style={{ borderColor: "var(--color-border)" }}>
        {/* Left column: plugins, scripts, frameworks */}
        <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r p-6 space-y-6" style={{ borderColor: "var(--color-border)" }}>
          {/* Plugins */}
          {detected.isWordPress && (
            <div>
              <div className="flex items-center justify-between mb-4">
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

              {!hasAnyPlugins ? (
                <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
                  {status.homepageFetched
                    ? "No WordPress plugins detected in the homepage HTML. Plugins may be loaded dynamically or the site may use a custom build process."
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
            </div>
          )}

          {/* Scripts & Libraries (non-WP sites) */}
          {hasAnyScripts && (
            <div className={detected.isWordPress ? "border-t pt-4" : ""} style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
                  <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Detected scripts & libraries</span>
                </div>
                <span className="text-xs font-mono" style={{ color: "var(--color-fg-muted)" }}>{detected.scripts.length} found</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {detected.scripts.slice(0, 30).map((s) => (
                  <span key={s} className="px-3 py-1.5 text-xs font-medium" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>{s}</span>
                ))}
                {detected.scripts.length > 30 && (
                  <span className="px-3 py-1.5 text-xs" style={{ color: "var(--color-fg-muted)" }}>+{detected.scripts.length - 30} more</span>
                )}
              </div>
            </div>
          )}

          {/* Analytics */}
          {hasAnyAnalytics && (
            <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
                  <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Analytics & tracking</span>
                </div>
                <span className="text-xs font-mono" style={{ color: "var(--color-fg-muted)" }}>{detected.analytics.length} found</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {detected.analytics.map((a) => (
                  <span key={a} className="px-3 py-1.5 text-xs font-medium" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>{a}</span>
                ))}
              </div>
            </div>
          )}

          {/* Frameworks */}
          {detected.frameworks.length > 0 && (
            <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
                <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Frameworks & libraries</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {detected.frameworks.map((fw) => (
                  <span key={fw} className="px-3 py-1.5 text-xs font-medium" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>{fw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Response headers */}
          {hasInterestingHeaders && (
            <div className="border-t pt-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
                <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Response headers</span>
              </div>
              <div className="space-y-2">
                {Object.entries(detected.responseHeaders).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 text-xs">
                    <span className="font-mono shrink-0" style={{ color: "var(--color-fg-muted)", minWidth: "140px" }}>{key}</span>
                    <span className="font-mono" style={{ color: "var(--color-fg-secondary)", wordBreak: "break-all" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Infrastructure, Site scale, Performance, Caching */}
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
                <span className="font-medium font-mono">
                  {status.sitemapFetched ? detected.estimatedPages.toLocaleString() : "No sitemap found"}
                </span>
              </div>
              {detected.isWordPress && (
                <div className="flex justify-between items-baseline">
                  <span style={{ color: "var(--color-fg-secondary)" }}>Heavy plugins</span>
                  <span className="font-medium font-mono">{detected.heavyPluginsCount}</span>
                </div>
              )}
              {detected.statusCode && (
                <div className="flex justify-between items-baseline">
                  <span style={{ color: "var(--color-fg-secondary)" }}>HTTP status</span>
                  <span className="font-medium font-mono">{detected.statusCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance — only show if we have actual data */}
          {hasPerformanceData && (
            <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
                <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Performance</span>
              </div>
              <div className="space-y-3 text-sm">
                {detected.ttfb !== null && (
                  <div className="flex justify-between items-baseline">
                    <span style={{ color: "var(--color-fg-secondary)" }}>TTFB</span>
                    <span className="font-medium font-mono">{detected.ttfb}ms</span>
                  </div>
                )}
                {detected.lcp !== null && (
                  <div className="flex justify-between items-baseline">
                    <span style={{ color: "var(--color-fg-secondary)" }}>LCP</span>
                    <span className="font-medium font-mono">{detected.lcp}ms</span>
                  </div>
                )}
                {detected.cls !== null && (
                  <div className="flex justify-between items-baseline">
                    <span style={{ color: "var(--color-fg-secondary)" }}>CLS</span>
                    <span className="font-medium font-mono">{detected.cls}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PageSpeed unavailable note */}
          {!hasPerformanceData && status.pageSpeedRateLimited && (
            <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
                <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>Performance</span>
              </div>
              <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                PageSpeed Insights API quota temporarily exhausted. No performance data available.
              </p>
            </div>
          )}

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
  if (!value) return null;
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-1.5" style={{ color: "var(--color-fg-secondary)" }}>{icon}{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function SystemInfo({ label, value, fallback, sub, icon }: { label: string; value: string | null; fallback?: string; sub?: string; icon: React.ReactNode }) {
  const displayValue = value || fallback || null;
  return (
    <div className="p-4 border" style={{ borderColor: "var(--color-border)", background: "var(--color-surface-raised)" }}>
      <div className="flex items-center gap-2 mb-2" style={{ color: "var(--color-fg-muted)" }}>
        {icon}
        <span className="text-xs font-medium tracking-widest uppercase">{label}</span>
      </div>
      <p className="text-sm font-medium truncate">{displayValue ?? "Not detected"}</p>
      {sub && <p className="text-xs font-mono mt-1" style={{ color: "var(--color-fg-muted)" }}>{sub}</p>}
    </div>
  );
}
