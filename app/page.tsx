"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CalculatorInputs, DetectedTech, CalculationResult, SavedReport } from "@/types";
import { calculateWorkers } from "@/lib/calculator";
import { saveReport } from "@/lib/storage";
import { analyzeSite } from "@/lib/scraper";
import ThemeToggle from "@/components/theme-toggle";
import UrlInput from "@/components/url-input";
import AutoDetectPanel from "@/components/auto-detect-panel";
import InputForm from "@/components/input-form";
import SimpleResult from "@/components/simple-result";
import DetailedReport from "@/components/detailed-report";
import HistoryDrawer from "@/components/history-drawer";
import { Cpu, Code2, History, ArrowRight } from "lucide-react";

const defaultDetected: DetectedTech = {
  isWordPress: false,
  hasWooCommerce: false,
  hasElementor: false,
  hasMemberPress: false,
  hasLearnDash: false,
  hasBuddyBoss: false,
  hasContactForm7: false,
  hasGravityForms: false,
  hasYoast: false,
  hasRankMath: false,
  hasWPRocket: false,
  hasW3TotalCache: false,
  hasLiteSpeedCache: false,
  hasCloudflare: false,
  cachePlugin: null,
  heavyPluginsCount: 0,
  estimatedPages: 0,
  ttfb: null,
  lcp: null,
  cls: null,
};

function buildDefaultInputs(detected: DetectedTech, domain: string): CalculatorInputs {
  let siteType: CalculatorInputs["siteType"] = "blog";
  let dynamicContentPercent = 20;
  let loggedInTrafficPercent = 5;
  let activePluginCount = 10;
  let objectCacheEnabled: CalculatorInputs["objectCacheEnabled"] = "unknown";
  let cdnEnabled: CalculatorInputs["cdnEnabled"] = "unknown";
  let avgPhpResponseTimeMs = 300;

  if (detected.hasWooCommerce) {
    siteType = "woocommerce";
    dynamicContentPercent = 40;
  } else if (detected.hasLearnDash) {
    siteType = "lms";
    dynamicContentPercent = 50;
    loggedInTrafficPercent = 30;
  } else if (detected.hasMemberPress || detected.hasBuddyBoss) {
    siteType = "membership";
    dynamicContentPercent = 50;
    loggedInTrafficPercent = 30;
  }

  if (detected.cachePlugin) objectCacheEnabled = "yes";
  if (detected.hasCloudflare) cdnEnabled = "yes";
  if (detected.heavyPluginsCount > 0) activePluginCount = Math.max(10, detected.heavyPluginsCount * 3);
  if (detected.ttfb && detected.ttfb > 0) avgPhpResponseTimeMs = detected.ttfb;

  return {
    domain,
    monthlyPageviews: 30000,
    monthlyUniqueVisitors: 15000,
    pagesPerSession: 2.5,
    peakConcurrentUsers: null,
    peakPercentageOfDaily: 20,
    siteType,
    dynamicContentPercent,
    loggedInTrafficPercent,
    adminUserCount: 1,
    activePluginCount,
    objectCacheEnabled,
    cdnEnabled,
    currentWorkerLimit: null,
    avgPhpResponseTimeMs,
    detectedTech: detected,
  };
}

export default function Home() {
  const [domain, setDomain] = useState("");
  const [detected, setDetected] = useState<DetectedTech>(defaultDetected);
  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const runCalculation = useCallback((data: CalculatorInputs) => {
    const res = calculateWorkers(data);
    setResult(res);
    const report: SavedReport = {
      id: crypto.randomUUID(),
      domain: data.domain,
      timestamp: Date.now(),
      inputs: data,
      result: res,
    };
    saveReport(report);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  const handleAnalyze = useCallback(async (url: string) => {
    setDomain(url);
    setAnalyzing(true);
    setResult(null);
    setShowForm(false);
    setShowDetailed(false);
    try {
      const tech = await analyzeSite(url);
      setDetected(tech);
      const defaults = buildDefaultInputs(tech, url);
      setInputs(defaults);
      runCalculation(defaults);
    } catch {
      const defaults = buildDefaultInputs(defaultDetected, url);
      setDetected(defaultDetected);
      setInputs(defaults);
      runCalculation(defaults);
    } finally {
      setAnalyzing(false);
    }
  }, [runCalculation]);

  const handleRefine = useCallback((data: CalculatorInputs) => {
    setInputs(data);
    runCalculation(data);
  }, [runCalculation]);

  const handleLoadReport = useCallback((report: SavedReport) => {
    setDomain(report.domain);
    setDetected(report.inputs.detectedTech);
    setInputs(report.inputs);
    setResult(report.result);
    setShowHistory(false);
    setShowDetailed(true);
  }, []);

  return (
    <main className="min-h-screen" style={{ background: "var(--color-bg)", color: "var(--color-fg)" }}>
      {/* Header */}
      <header className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5" style={{ color: "var(--color-fg)" }} strokeWidth={1.5} />
            <span className="font-display text-lg font-medium tracking-tight">PHP Worker Calculator</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors border"
              style={{
                color: "var(--color-muted)",
                borderColor: "var(--color-border)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--color-fg)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--color-muted)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
              }}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
            <a
              href="https://github.com/zumuuser/php-worker-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors border"
              style={{
                color: "var(--color-muted)",
                borderColor: "var(--color-border)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--color-fg)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = "var(--color-muted)";
                (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
              }}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-12 md:pt-24 md:pb-16">
        <div className="max-w-3xl">
          <p className="text-xs font-medium tracking-widest uppercase mb-6" style={{ color: "var(--color-fg-muted)" }}>
            Open source &middot; Client-side &middot; No data leaves your browser
          </p>
          <h1 className="font-display text-5xl md:text-7xl font-medium tracking-tight text-balance mb-6">
            How many PHP workers do you need?
          </h1>
          <p className="text-lg md:text-xl leading-relaxed max-w-2xl" style={{ color: "var(--color-fg-secondary)" }}>
            Enter your website URL. We auto-detect your tech stack and calculate the exact number of PHP workers required — no guesswork.
          </p>
        </div>
      </section>

      {/* URL Input */}
      <section className="max-w-6xl mx-auto px-6 pb-8">
        <UrlInput onAnalyze={handleAnalyze} analyzing={analyzing} />
      </section>

      {/* Results area */}
      {(result || analyzing) && (
        <section ref={resultRef} className="max-w-6xl mx-auto px-6 pb-24 space-y-12">
          {/* Detected Tech */}
          {!analyzing && <AutoDetectPanel detected={detected} domain={domain} />}

          {/* Result */}
          {!analyzing && result && inputs && (
            <div className="animate-fade-up">
              <SimpleResult result={result} inputs={inputs} />
            </div>
          )}

          {/* Actions */}
          {!analyzing && result && inputs && (
            <div className="flex flex-wrap items-center gap-4 animate-fade-up delay-100">
              <button
                onClick={() => setShowForm((s) => !s)}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium tracking-wide uppercase transition-all"
                style={{
                  background: showForm ? "transparent" : "var(--color-fg)",
                  color: showForm ? "var(--color-fg)" : "var(--color-bg)",
                  border: "1px solid var(--color-fg)",
                }}
              >
                {showForm ? "Close refine" : "Refine manually"}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowDetailed((s) => !s)}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium tracking-wide uppercase transition-all"
                style={{
                  background: "transparent",
                  color: "var(--color-fg)",
                  border: "1px solid var(--color-border-strong)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)";
                }}
              >
                {showDetailed ? "Hide detailed report" : "Detailed report"}
              </button>
            </div>
          )}

          {/* Manual Form */}
          {showForm && inputs && (
            <div className="animate-fade-up delay-100">
              <InputForm detected={detected} inputs={inputs} onSubmit={handleRefine} />
            </div>
          )}

          {/* Detailed Report */}
          {showDetailed && result && inputs && (
            <div className="animate-fade-up delay-200">
              <DetailedReport result={result} inputs={inputs} />
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {!result && !analyzing && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div
            className="border-t pt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
            style={{ borderColor: "var(--color-border)" }}
          >
            {[
              { num: "01", title: "Enter URL", desc: "Paste your domain. We scan for WordPress, plugins, caching, and performance metrics." },
              { num: "02", title: "Auto-detect", desc: "Our engine reads your tech stack from public signals — robots.txt respected, no aggressive scanning." },
              { num: "03", title: "Get result", desc: "Instant calculation based on your traffic, plugins, and site type. Refine manually if needed." },
            ].map((step) => (
              <div key={step.num} className="space-y-3">
                <span className="font-display text-4xl font-medium" style={{ color: "var(--color-fg-muted)" }}>
                  {step.num}
                </span>
                <h3 className="font-display text-lg font-medium">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-fg-secondary)" }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
            MIT License. No data leaves your browser.
          </p>
          <div className="flex items-center gap-6 text-xs" style={{ color: "var(--color-fg-muted)" }}>
            <a href="https://github.com/zumuuser/php-worker-calculator" className="hover:text-[var(--color-fg)] transition-colors">GitHub</a>
            <span className="hidden sm:inline">&middot;</span>
            <span>Built with Next.js</span>
          </div>
        </div>
      </footer>

      <HistoryDrawer open={showHistory} onClose={() => setShowHistory(false)} onLoad={handleLoadReport} />
    </main>
  );
}
