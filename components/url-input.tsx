"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface Props {
  onAnalyze: (domain: string) => void;
  analyzing: boolean;
}

export default function UrlInput({ onAnalyze, analyzing }: Props) {
  const [domain, setDomain] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domain.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!clean) return;
    onAnalyze(clean);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        className="flex items-stretch transition-all"
        style={{
          border: `1px solid ${focused ? "var(--color-fg)" : "var(--color-border-strong)"}`,
        }}
      >
        <span
          className="flex items-center px-4 text-sm font-medium shrink-0"
          style={{ color: "var(--color-fg-muted)", background: "var(--color-surface-raised)" }}
        >
          https://
        </span>
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="yourwebsite.com"
          className="flex-1 min-w-0 bg-transparent px-4 py-4 text-lg font-medium outline-none"
          style={{ color: "var(--color-fg)" }}
          disabled={analyzing}
        />
        <button
          type="submit"
          disabled={analyzing || !domain.trim()}
          className="inline-flex items-center gap-2 px-6 py-4 text-sm font-medium tracking-wide uppercase transition-all shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: "var(--color-fg)",
            color: "var(--color-bg)",
          }}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="hidden sm:inline">Analyzing</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Analyze</span>
            </>
          )}
        </button>
      </div>
      <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
        Respects robots.txt. No aggressive scanning. All analysis runs in your browser.
      </p>
    </form>
  );
}
