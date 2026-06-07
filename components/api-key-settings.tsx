"use client";

import { useState, useEffect } from "react";
import { ApiKeys } from "@/types";
import { getApiKeys, setApiKeys } from "@/lib/api-keys";
import { Key, ExternalLink, X, Zap, Globe, Shield } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ApiKeySettings({ open, onClose }: Props) {
  const [keys, setKeysState] = useState<ApiKeys>({});

  useEffect(() => {
    if (open) setKeysState(getApiKeys());
  }, [open]);

  const updateKey = (service: keyof ApiKeys, value: string) => {
    const next = { ...keys, [service]: value.trim() || undefined };
    setKeysState(next);
    setApiKeys(next);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 transition-opacity"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-md h-full flex flex-col animate-fade-in"
        style={{
          background: "var(--color-bg)",
          borderLeft: "1px solid var(--color-border)",
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <h2 className="font-display text-lg font-medium tracking-tight flex items-center gap-2">
            <Key className="w-5 h-5" strokeWidth={1.5} />
            API Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 transition-colors"
            style={{ color: "var(--color-fg-muted)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Worker URL — primary recommendation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" style={{ color: "var(--color-fg)" }} />
              <h3 className="text-sm font-medium">Detection Proxy URL</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--color-fg-secondary)" }}>
              Deploy our free Cloudflare Worker for 100% reliable detection.
              Without it, most sites block our browser scans due to CORS.
            </p>
            <a
              href="https://github.com/zumuuser/php-worker-calculator/blob/main/API_WORKER.md"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: "var(--color-fg)" }}
            >
              Deployment guide (60 seconds)
              <ExternalLink className="w-3 h-3" />
            </a>
            <input
              type="url"
              value={keys.workerUrl || ""}
              onChange={(e) => updateKey("workerUrl", e.target.value)}
              placeholder="https://your-worker.your-name.workers.dev"
              className="w-full"
            />
          </div>

          <div className="border-t" style={{ borderColor: "var(--color-border)" }} />

          {/* Optional APIs */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium" style={{ color: "var(--color-fg-secondary)" }}>
              Optional third-party APIs
            </h3>
            <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
              These are not required if you use the Detection Proxy above.
              Most do not support browser CORS and need their own server-side proxy.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">WhatCMS</label>
                <a href="https://whatcms.org/API" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs transition-colors" style={{ color: "var(--color-fg-muted)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; }}>
                  Get key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>CMS detection. Free: 1,000 req/month.</p>
              <input type="password" value={keys.whatcms || ""} onChange={(e) => updateKey("whatcms", e.target.value)} placeholder="WhatCMS API key" className="w-full" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">urlscan.io</label>
                <a href="https://urlscan.io/about-api/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs transition-colors" style={{ color: "var(--color-fg-muted)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; }}>
                  Get key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>Full page scan with tech stack. Free: 10K lookups/day.</p>
              <input type="password" value={keys.urlscan || ""} onChange={(e) => updateKey("urlscan", e.target.value)} placeholder="urlscan.io API key" className="w-full" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Shodan</label>
                <a href="https://account.shodan.io/register" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs transition-colors" style={{ color: "var(--color-fg-muted)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; }}>
                  Get key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>Infrastructure fingerprinting. Free: 100 credits.</p>
              <input type="password" value={keys.shodan || ""} onChange={(e) => updateKey("shodan", e.target.value)} placeholder="Shodan API key" className="w-full" />
            </div>
          </div>

          <div className="border-t pt-4 text-xs" style={{ borderColor: "var(--color-border)" }}>
            <p style={{ color: "var(--color-fg-muted)" }}>
              <strong>Privacy note:</strong> All keys are stored in your browser&apos;s localStorage.
              They are never sent to our servers. The Detection Proxy runs on your own Cloudflare account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
