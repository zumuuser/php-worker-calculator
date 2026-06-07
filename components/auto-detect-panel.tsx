"use client";

import { DetectedTech, ScanStatus, DnsInfo } from "@/types";
import { Check, X, Globe, Zap, Box, Shield, AlertCircle, Wifi, Server, Mail, MapPin } from "lucide-react";

interface Props {
  detected: DetectedTech;
  domain: string;
  status: ScanStatus;
  dns: DnsInfo;
}

interface PluginItem {
  key: keyof DetectedTech;
  label: string;
}

const PLUGINS: PluginItem[] = [
  { key: "hasWooCommerce", label: "WooCommerce" },
  { key: "hasElementor", label: "Elementor" },
  { key: "hasMemberPress", label: "MemberPress" },
  { key: "hasLearnDash", label: "LearnDash" },
  { key: "hasBuddyBoss", label: "BuddyBoss" },
  { key: "hasContactForm7", label: "Contact Form 7" },
  { key: "hasGravityForms", label: "Gravity Forms" },
  { key: "hasYoast", label: "Yoast SEO" },
  { key: "hasRankMath", label: "Rank Math" },
  { key: "hasWPRocket", label: "WP Rocket" },
  { key: "hasW3TotalCache", label: "W3 Total Cache" },
  { key: "hasLiteSpeedCache", label: "LiteSpeed Cache" },
  { key: "hasCloudflare", label: "Cloudflare" },
];

export default function AutoDetectPanel({ detected, domain, status, dns }: Props) {
  const detectedPlugins = PLUGINS.filter((p) => detected[p.key]);
  const notDetected = PLUGINS.filter((p) => !detected[p.key]);
  const allFailed = !status.homepageFetched && !status.pageSpeedFetched && !status.dnsFetched;

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-medium tracking-tight">{domain}</h2>
        <div className="flex items-center gap-2">
          {detected.cms && (
            <span className="text-xs font-medium tracking-widest uppercase px-2 py-1" style={{ background: "var(--color-fg)", color: "var(--color-bg)" }}>
              {detected.cms}
            </span>
          )}
          {!detected.cms && status.homepageFetched && (
            <span className="text-xs font-medium tracking-widest uppercase px-2 py-1 border" style={{ borderColor: "var(--color-fg)", color: "var(--color-fg)" }}>
              Unknown CMS
            </span>
          )}
          {!status.homepageFetched && !detected.cms && (
            <span className="text-xs font-medium tracking-widest uppercase px-2 py-1 border" style={{ borderColor: "var(--color-border-strong)", color: "var(--color-fg-muted)" }}>
              Could not scan
            </span>
          )}
        </div>
      </div>

      {/* Scan status bar */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 text-xs" style={{ color: "var(--color-fg-muted)" }}>
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
        <div className="flex items-start gap-3 p-4 mb-8 border" style={{ borderColor: "var(--color-warn)", background: "rgba(202,138,4,0.04)" }}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--color-warn)" }} />
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--color-warn)" }}>
              Could not fetch site data
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-fg-secondary)" }}>
              The site blocks cross-origin requests and our CORS proxies couldn't reach it either.
              DNS detection below still works. Please fill in your configuration manually.
            </p>
          </div>
        </div>
      )}

      <div className="border-t grid grid-cols-1 lg:grid-cols-3 gap-0" style={{ borderColor: "var(--color-border)" }}>
        {/* Left column: Plugins & Frameworks */}
        <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r p-6 space-y-6" style={{ borderColor: "var(--color-border)" }}>
          {/* Frameworks */}
          {detected.frameworks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
                <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                  Frameworks
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {detected.frameworks.map((fw) => (
                  <span key={fw} className="px-3 py-1.5 text-xs font-medium" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
                    {fw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Plugins */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Box className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Detected plugins & tools
              </span>
              <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                ({detectedPlugins.length} found)
              </span>
            </div>

            {detectedPlugins.length === 0 && !status.homepageFetched ? (
              <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
                Could not scan for plugins — site blocked our fetch requests.
              </p>
            ) : detectedPlugins.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
                No known plugins detected in the HTML source.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {detectedPlugins.map((p) => (
                  <div key={p.key} className="flex items-center gap-2 px-3 py-2 text-sm" style={{ background: "var(--color-surface-raised)", border: "1px solid var(--color-border)" }}>
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-success)" }} strokeWidth={2.5} />
                    <span className="truncate">{p.label}</span>
                  </div>
                ))}
              </div>
            )}

            {notDetected.length > 0 && detectedPlugins.length > 0 && status.homepageFetched && (
              <div className="pt-3">
                <p className="text-xs mb-2" style={{ color: "var(--color-fg-muted)" }}>Not detected:</p>
                <div className="flex flex-wrap gap-2">
                  {notDetected.slice(0, 8).map((p) => (
                    <span key={p.key} className="inline-flex items-center gap-1 px-2 py-1 text-xs" style={{ color: "var(--color-fg-muted)" }}>
                      <X className="w-3 h-3" strokeWidth={2} />
                      {p.label}
                    </span>
                  ))}
                  {notDetected.length > 8 && (
                    <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>+{notDetected.length - 8} more</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Infrastructure & Performance */}
        <div className="p-6 space-y-6">
          {/* DNS Infrastructure */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Server className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Infrastructure
              </span>
            </div>
            <div className="space-y-3">
              <DnsRow label="Hosting" value={dns.hostingProvider} icon={<Server className="w-3.5 h-3.5" />} />
              <DnsRow label="CDN" value={dns.cdnProvider} icon={<MapPin className="w-3.5 h-3.5" />} />
              <DnsRow label="Email" value={dns.emailProvider} icon={<Mail className="w-3.5 h-3.5" />} />
              {dns.nameservers.length > 0 && (
                <div className="pt-1">
                  <p className="text-xs mb-1" style={{ color: "var(--color-fg-muted)" }}>Nameservers:</p>
                  <div className="flex flex-wrap gap-1">
                    {dns.nameservers.slice(0, 3).map((ns) => (
                      <span key={ns} className="text-xs font-mono px-1.5 py-0.5" style={{ background: "var(--color-surface-raised)" }}>
                        {ns.replace(/\.$/, "")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Site scale
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>Estimated pages</span>
                <span className="font-medium font-mono">
                  {status.sitemapFetched && detected.estimatedPages > 0
                    ? detected.estimatedPages.toLocaleString()
                    : status.sitemapFetched
                    ? "0"
                    : "—"}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>Heavy plugins</span>
                <span className="font-medium font-mono">{detected.heavyPluginsCount}</span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Performance
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>TTFB</span>
                <span className="font-medium font-mono">
                  {status.pageSpeedFetched && detected.ttfb ? `${detected.ttfb}ms` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>LCP</span>
                <span className="font-medium font-mono">
                  {status.pageSpeedFetched && detected.lcp ? `${detected.lcp}ms` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>CLS</span>
                <span className="font-medium font-mono">
                  {status.pageSpeedFetched && detected.cls !== null ? detected.cls : "—"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t pt-6" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Caching
              </span>
            </div>
            <p className="text-sm font-medium">
              {detected.cachePlugin
                ? detected.cachePlugin
                : status.homepageFetched
                ? "No cache plugin detected"
                : "Could not scan"}
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
      {ok ? (
        <Check className="w-3 h-3" style={{ color: "var(--color-success)" }} strokeWidth={3} />
      ) : (
        <X className="w-3 h-3" style={{ color: "var(--color-fg-muted)" }} strokeWidth={3} />
      )}
      {label}
    </span>
  );
}

function DnsRow({ label, value, icon }: { label: string; value: string | null; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5" style={{ color: "var(--color-fg-secondary)" }}>
        {icon}
        {label}
      </span>
      <span className="font-medium">{value ?? "—"}</span>
    </div>
  );
}
