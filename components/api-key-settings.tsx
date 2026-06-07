"use client";

import { useState, useEffect } from "react";
import { ApiKeys } from "@/types";
import { getApiKeys, setApiKeys } from "@/lib/api-keys";
import { Key, ExternalLink, X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const API_SERVICES = [
  {
    key: "whatcms" as const,
    name: "WhatCMS",
    description: "CMS & technology detection. Free tier: 1,000 requests/month.",
    url: "https://whatcms.org/API",
  },
  {
    key: "urlscan" as const,
    name: "urlscan.io",
    description: "Full page scan with headers, resources & tech stack. Free tier: 10K lookups/day.",
    url: "https://urlscan.io/about-api/",
  },
  {
    key: "shodan" as const,
    name: "Shodan",
    description: "Infrastructure & server fingerprinting. Free tier: 100 credits.",
    url: "https://account.shodan.io/register",
  },
];

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
            API Keys
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm leading-relaxed" style={{ color: "var(--color-fg-secondary)" }}>
            Enter API keys to enable premium detection sources. Keys are stored in your browser&apos;s localStorage and never sent to our servers.
          </p>

          {API_SERVICES.map((svc) => (
            <div key={svc.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{svc.name}</label>
                <a
                  href={svc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs transition-colors"
                  style={{ color: "var(--color-fg-muted)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; }}
                >
                  Get key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
                {svc.description}
              </p>
              <input
                type="password"
                value={keys[svc.key] || ""}
                onChange={(e) => updateKey(svc.key, e.target.value)}
                placeholder={`Paste your ${svc.name} API key`}
                className="w-full"
              />
            </div>
          ))}

          <div
            className="border-t pt-6 text-xs space-y-2"
            style={{ borderColor: "var(--color-border)" }}
          >
            <p style={{ color: "var(--color-fg-muted)" }}>
              <strong>Note:</strong> Most tech detection APIs do not support browser CORS. 
              For reliable detection, you may need to deploy a small proxy (Cloudflare Worker, Netlify Function, etc.) 
              that calls these APIs server-side.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
