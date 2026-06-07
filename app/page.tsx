"use client";

import { useState, useCallback, useRef } from "react";
import { CalculatorInputs, DetectedTech, CalculationResult, SavedReport, ScanStatus, DnsInfo } from "@/types";
import { calculateWorkers } from "@/lib/calculator";
import { saveReport } from "@/lib/storage";
import { analyzeSite, AnalysisResult } from "@/lib/scraper";
import ThemeToggle from "@/components/theme-toggle";
import ApiKeySettings from "@/components/api-key-settings";
import UrlInput from "@/components/url-input";
import AutoDetectPanel from "@/components/auto-detect-panel";
import InputForm from "@/components/input-form";
import SimpleResult from "@/components/simple-result";
import DetailedReport from "@/components/detailed-report";
import HistoryDrawer from "@/components/history-drawer";
import { Cpu, Code2, History, ArrowRight, Settings } from "lucide-react";

const defaultDetected: DetectedTech = {
  cms: null,
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
  frameworks: [],
};

const defaultStatus: ScanStatus = {
  homepageFetched: false,
  sitemapFetched: false,
  pageSpeedFetched: false,
  dnsFetched: false,
  proxyUsed: null,
};

const defaultDns: DnsInfo = {
  nameservers: [],
  aRecords: [],
  cnameRecords: [],
  mxRecords: [],
  txtRecords: [],
  hostingProvider: null,
  cdnProvider: null,
  emailProvider: null,
};

function buildInputsFromDetection(detected: DetectedTech, domain: string): CalculatorInputs {
  let siteType: CalculatorInputs["siteType"] = "blog";
  let dynamicContentPercent = 20;
  let loggedInTrafficPercent = 5;
  let activePluginCount = detected.heavyPluginsCount > 0 ? Math.max(10, detected.heavyPluginsCount * 3) : 10;
  let objectCacheEnabled: CalculatorInputs["objectCacheEnabled"] = detected.cachePlugin ? "yes" : "unknown";
  let cdnEnabled: CalculatorInputs["cdnEnabled"] = detected.hasCloudflare ? "yes" : "unknown";
  let avgPhpResponseTimeMs = detected.ttfb && detected.ttfb > 0 ? detected.ttfb : 300;

  if (detected.hasWooCommerce || detected.cms === "Shopify" || detected.cms === "Magento") {
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
  } else if (detected.cms === "Drupal" || detected.cms === "Joomla") {
    siteType = "mixed";
    dynamicContentPercent = 30;
  } else if (detected.cms === "Ghost" || detected.cms === "Next.js" || detected.cms === "Astro") {
    siteType = "blog";
    dynamicContentPercent = 15;
  }

  return {
    domain,
    monthlyPageviews: 0,
    monthlyUniqueVisitors: 0,
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
  const [scanStatus, setScanStatus] = useState<ScanStatus>(defaultStatus);
  const [dnsInfo, setDnsInfo] = useState<DnsInfo>(defaultDns);
  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);
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
    setShowDetailed(false);
    try {
      const analysis: AnalysisResult = await analyzeSite(url);
      setDetected(analysis.tech);
      setScanStatus(analysis.status);
      setDnsInfo(analysis.dns);
      const defaults = buildInputsFromDetection(analysis.tech, url);
      setInputs(defaults);
    } catch {
      const defaults = buildInputsFromDetection(defaultDetected, url);
      setDetected(defaultDetected);
      setScanStatus(defaultStatus);
      setDnsInfo(defaultDns);
      setInputs(defaults);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleCalculate = useCallback((data: CalculatorInputs) => {
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

  const hasAnalyzed = inputs !== null;

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
              style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={() => setShowApiSettings(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors border"
              style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">APIs</span>
            </button>
            <a
              href="https://github.com/zumuuser/php-worker-calculator"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors border"
              style={{ color: "var(--color-muted)", borderColor: "var(--color-border)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}
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
      {hasAnalyzed && (
        <section ref={resultRef} className="max-w-6xl mx-auto px-6 pb-24 space-y-12">
          <AutoDetectPanel detected={detected} domain={domain} status={scanStatus} dns={dnsInfo} />

          <div className="animate-fade-up">
            <InputForm detected={detected} inputs={inputs!} onSubmit={handleCalculate} />
          </div>

          {result && (
            <div className="animate-fade-up delay-100 space-y-8">
              <SimpleResult result={result} inputs={inputs!} />

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowDetailed((s) => !s)}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-medium tracking-wide uppercase transition-all"
                  style={{
                    background: "transparent",
                    color: "var(--color-fg)",
                    border: "1px solid var(--color-border-strong)",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)"; }}
                >
                  {showDetailed ? "Hide detailed report" : "Detailed report"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {showDetailed && (
                <div className="animate-fade-up delay-100">
                  <DetailedReport result={result} inputs={inputs!} />
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {!hasAnalyzed && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="border-t pt-12 grid grid-cols-1 md:grid-cols-3 gap-8" style={{ borderColor: "var(--color-border)" }}>
            {[
              { num: "01", title: "Enter URL", desc: "Paste your domain. We scan DNS, detect CMS, plugins, caching, and performance metrics." },
              { num: "02", title: "Review detection", desc: "We show exactly what we found and what we couldn't. DNS always works; page fetching may be blocked by CORS." },
              { num: "03", title: "Enter traffic & calculate", desc: "Fill in your real traffic numbers. We calculate instantly in your browser." },
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
      <ApiKeySettings open={showApiSettings} onClose={() => setShowApiSettings(false)} />
    </main>
  );
}
