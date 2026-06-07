"use client";

import { DetectedTech } from "@/types";
import { Check, X, Globe, Zap, Box, Shield } from "lucide-react";

interface Props {
  detected: DetectedTech;
  domain: string;
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

export default function AutoDetectPanel({ detected, domain }: Props) {
  const detectedPlugins = PLUGINS.filter((p) => detected[p.key]);
  const notDetected = PLUGINS.filter((p) => !detected[p.key]);

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-medium tracking-tight">
          {domain}
        </h2>
        <span
          className="text-xs font-medium tracking-widest uppercase px-2 py-1"
          style={{
            background: detected.isWordPress ? "var(--color-fg)" : "transparent",
            color: detected.isWordPress ? "var(--color-bg)" : "var(--color-fg)",
            border: "1px solid var(--color-fg)",
          }}
        >
          {detected.isWordPress ? "WordPress" : "Unknown platform"}
        </span>
      </div>

      <div
        className="border-t grid grid-cols-1 lg:grid-cols-3 gap-0"
        style={{ borderColor: "var(--color-border)" }}
      >
        {/* Detected Plugins */}
        <div className="lg:col-span-2 border-b lg:border-b-0 lg:border-r p-6 space-y-4" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Box className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
            <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
              Detected plugins & tools
            </span>
          </div>

          {detectedPlugins.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--color-fg-muted)" }}>
              No known plugins detected. The site may use custom or undetectable tools.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {detectedPlugins.map((p) => (
                <div
                  key={p.key}
                  className="flex items-center gap-2 px-3 py-2 text-sm"
                  style={{
                    background: "var(--color-surface-raised)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--color-success)" }} strokeWidth={2.5} />
                  <span className="truncate">{p.label}</span>
                </div>
              ))}
            </div>
          )}

          {notDetected.length > 0 && detectedPlugins.length > 0 && (
            <div className="pt-2">
              <p className="text-xs mb-2" style={{ color: "var(--color-fg-muted)" }}>
                Not detected:
              </p>
              <div className="flex flex-wrap gap-2">
                {notDetected.slice(0, 8).map((p) => (
                  <span
                    key={p.key}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs"
                    style={{ color: "var(--color-fg-muted)" }}
                  >
                    <X className="w-3 h-3" strokeWidth={2} />
                    {p.label}
                  </span>
                ))}
                {notDetected.length > 8 && (
                  <span className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                    +{notDetected.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Site scale
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>Estimated pages</span>
                <span className="font-medium font-mono">{detected.estimatedPages > 0 ? detected.estimatedPages.toLocaleString() : "—"}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>Heavy plugins</span>
                <span className="font-medium font-mono">{detected.heavyPluginsCount}</span>
              </div>
            </div>
          </div>

          <div
            className="border-t pt-6"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Performance
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>TTFB</span>
                <span className="font-medium font-mono">{detected.ttfb ? `${detected.ttfb}ms` : "—"}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>LCP</span>
                <span className="font-medium font-mono">{detected.lcp ? `${detected.lcp}ms` : "—"}</span>
              </div>
              <div className="flex justify-between items-baseline text-sm">
                <span style={{ color: "var(--color-fg-secondary)" }}>CLS</span>
                <span className="font-medium font-mono">{detected.cls ?? "—"}</span>
              </div>
            </div>
          </div>

          <div
            className="border-t pt-6"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4" strokeWidth={1.5} style={{ color: "var(--color-fg-secondary)" }} />
              <span className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
                Caching
              </span>
            </div>
            <p className="text-sm font-medium">
              {detected.cachePlugin || "No cache plugin detected"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
