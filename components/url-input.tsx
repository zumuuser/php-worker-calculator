"use client";

import { useState } from "react";
import { Globe, Loader2, Search, ArrowRight, Shield } from "lucide-react";

interface Props {
  onAnalyze: (domain: string) => void;
  analyzing: boolean;
}

export default function UrlInput({ onAnalyze, analyzing }: Props) {
  const [domain, setDomain] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = domain.trim();
    if (!clean) return;
    onAnalyze(clean);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Analyze Your Site</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            We detect WordPress, plugins, cache setup & performance metrics
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center rounded-2xl border-2 bg-slate-50 dark:bg-slate-950 transition-all duration-200 ${
            focused
              ? "border-blue-500 shadow-lg shadow-blue-500/10"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <span className="pl-5 text-slate-400 font-medium text-lg">https://</span>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="yourwebsite.com"
            className="flex-1 bg-transparent px-2 py-5 text-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={analyzing || !domain.trim()}
            className="mr-2 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-95"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analyze
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          Respects robots.txt
        </div>
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          No aggressive scanning
        </div>
      </div>
    </div>
  );
}
