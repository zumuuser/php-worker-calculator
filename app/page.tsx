"use client";

import { useState, useCallback, useRef } from "react";
import { CalculatorInputs, DetectedTech, CalculationResult, SavedReport, ScanStatus, DnsInfo } from "@/types";
import { calculateWorkers, buildAutoInputs } from "@/lib/calculator";
import { saveReport } from "@/lib/storage";
import { analyzeSite, AnalysisResult } from "@/lib/scraper";
import ThemeToggle from "@/components/theme-toggle";
import ApiKeySettings from "@/components/api-key-settings";
import UrlInput from "@/components/url-input";
import AutoDetectPanel from "@/components/auto-detect-panel";
import InputForm from "@/components/input-form";
import DetailedReport from "@/components/detailed-report";
import HistoryDrawer from "@/components/history-drawer";
import { Cpu, Code2, History, Settings, ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";

const defaultDetected: DetectedTech = {
  cms: null, cmsVersion: null, phpVersion: null, theme: null, themeVersion: null,
  isWordPress: false, isPhpSite: false, hasWooCommerce: false, hasElementor: false, hasMemberPress: false,
  hasLearnDash: false, hasBuddyBoss: false, hasContactForm7: false, hasGravityForms: false,
  hasYoast: false, hasRankMath: false, hasWPRocket: false, hasW3TotalCache: false,
  hasLiteSpeedCache: false, hasCloudflare: false, cachePlugin: null, heavyPluginsCount: 0,
  estimatedPages: 0, ttfb: null, lcp: null, cls: null, frameworks: [], plugins: [], serverSoftware: null,
  scripts: [], analytics: [], metaDescription: null, responseHeaders: {}, statusCode: null,
};

const defaultStatus: ScanStatus = {
  homepageFetched: false, sitemapFetched: false, pageSpeedFetched: false,
  dnsFetched: false, proxyUsed: null, pageSpeedRateLimited: false,
};

const defaultDns: DnsInfo = {
  nameservers: [], aRecords: [], cnameRecords: [], mxRecords: [], txtRecords: [],
  hostingProvider: null, cdnProvider: null, emailProvider: null,
};

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
  const [showForm, setShowForm] = useState(false);
  const [justUpdated, setJustUpdated] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const runCalculation = useCallback((data: CalculatorInputs) => {
    const res = calculateWorkers(data);
    setResult(res);
    const report: SavedReport = {
      id: crypto.randomUUID(), domain: data.domain, timestamp: Date.now(),
      inputs: data, result: res,
    };
    saveReport(report);
  }, []);

  const handleAnalyze = useCallback(async (url: string) => {
    setDomain(url);
    setAnalyzing(true);
    setResult(null);
    setShowDetailed(false);
    setShowForm(false);
    setJustUpdated(false);
    try {
      const analysis: AnalysisResult = await analyzeSite(url);
      setDetected(analysis.tech);
      setScanStatus(analysis.status);
      setDnsInfo(analysis.dns);
      const autoInputs = buildAutoInputs(analysis.tech, url);
      setInputs(autoInputs);
      runCalculation(autoInputs);
    } catch {
      const autoInputs = buildAutoInputs(defaultDetected, url);
      setDetected(defaultDetected);
      setScanStatus(defaultStatus);
      setDnsInfo(defaultDns);
      setInputs(autoInputs);
      runCalculation(autoInputs);
    } finally {
      setAnalyzing(false);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [runCalculation]);

  const handleRefine = useCallback((data: CalculatorInputs) => {
    setInputs(data);
    runCalculation(data);
    setShowForm(false);
    setJustUpdated(true);
    setTimeout(() => setJustUpdated(false), 3000);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
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
            <button onClick={() => setShowHistory(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors border" style={{ color: "var(--color-fg-muted)", borderColor: "var(--color-border)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
              <History className="w-3.5 h-3.5" /><span className="hidden sm:inline">History</span>
            </button>
            <button onClick={() => setShowApiSettings(true)} className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors border" style={{ color: "var(--color-fg-muted)", borderColor: "var(--color-border)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
              <Settings className="w-3.5 h-3.5" /><span className="hidden sm:inline">APIs</span>
            </button>
            <a href="https://github.com/zumuuser/php-worker-calculator" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors border" style={{ color: "var(--color-fg-muted)", borderColor: "var(--color-border)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--color-fg-muted)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)"; }}>
              <Code2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">GitHub</span>
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-8 md:pt-20">
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl md:text-6xl font-medium tracking-tight text-balance mb-4">
            How many PHP workers do you need?
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "var(--color-fg-secondary)" }}>
            Enter your website URL. We auto-detect your tech stack, plugins, and infrastructure — then calculate the exact number of PHP workers required.
          </p>
        </div>
      </section>

      {/* URL Input */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <UrlInput onAnalyze={handleAnalyze} analyzing={analyzing} />
      </section>

      {/* ── BIG RESULT AT CENTER ── */}
      {hasAnalyzed && result && (
        <section ref={resultRef} className="max-w-6xl mx-auto px-6 pb-8">
          <div className="border p-8 md:p-12" style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}>
            {/* Non-PHP site warning */}
            {!result.isPhpSite && (
              <div className="mb-8 p-4 border flex items-start gap-3" style={{ borderColor: "var(--color-warn)", background: "rgba(202,138,4,0.04)" }}>
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--color-warn)" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--color-warn)" }}>
                    This site does not appear to use PHP
                  </p>
                  <p className="text-sm mt-1" style={{ color: "var(--color-fg-secondary)" }}>
                    Detected {detected.cms || "platform"} — PHP workers only apply to PHP-based platforms like WordPress, Magento, Drupal, Laravel, etc.
                    The number shown is a theoretical estimate if this site were running on PHP.
                  </p>
                </div>
              </div>
            )}

            <div className="text-center space-y-4">
              <p className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-muted)" }}>
                Recommended for {domain}
              </p>
              <div className="flex items-baseline justify-center gap-4">
                <span className="font-display text-7xl md:text-9xl font-medium tracking-tighter">
                  {result.recommendedWorkers}
                </span>
                <span className="text-xl md:text-2xl font-medium" style={{ color: "var(--color-fg-secondary)" }}>
                  PHP workers
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium tracking-wide uppercase" style={{ background: "var(--color-fg)", color: "var(--color-bg)" }}>
                  {result.tier}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium tracking-wide uppercase border" style={{ borderColor: "var(--color-border-strong)" }}>
                  {result.maxConcurrentUsers.toLocaleString()} concurrent users
                </span>
                <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium tracking-wide uppercase border" style={{ borderColor: "var(--color-border-strong)" }}>
                  {result.maxMonthlyPageviews.toLocaleString()} pageviews/mo capacity
                </span>
              </div>

              {/* Honest explanation */}
              <p className="text-sm max-w-xl mx-auto" style={{ color: "var(--color-fg-secondary)" }}>
                {result.isPhpSite ? (
                  <>
                    Based on {detected.cms} with {detected.plugins.length} detected plugins.
                    Traffic estimated at {inputs!.monthlyPageviews.toLocaleString()} pageviews/month
                    <span className="inline-flex items-center gap-1 ml-1" style={{ color: "var(--color-fg-muted)" }}>
                      ({result.trafficEstimate.confidence} confidence
                      {result.trafficEstimate.confidence === 'low' && ' — refine for accuracy'})
                    </span>
                  </>
                ) : (
                  <>
                    Detected {detected.cms || "platform"} with {detected.scripts.length} scripts/libraries.
                    Traffic estimated at {inputs!.monthlyPageviews.toLocaleString()} pageviews/month
                    <span className="inline-flex items-center gap-1 ml-1" style={{ color: "var(--color-fg-muted)" }}>
                      ({result.trafficEstimate.confidence} confidence
                      {result.trafficEstimate.confidence === 'low' && ' — refine for accuracy'})
                    </span>
                  </>
                )}
              </p>

              {/* Just updated indicator */}
              {justUpdated && (
                <div className="flex items-center justify-center gap-2 text-xs font-medium" style={{ color: "var(--color-success)" }}>
                  <CheckCircle2 className="w-4 h-4" />
                  Calculation updated with your custom values
                </div>
              )}

              <div className="flex items-center justify-center gap-4 pt-2">
                <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium tracking-wide uppercase transition-all border" style={{ borderColor: "var(--color-fg)", color: "var(--color-fg)" }}>
                  {showForm ? "Close refine" : "Refine calculation"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setShowDetailed((s) => !s)} className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium tracking-wide uppercase transition-all border" style={{ borderColor: "var(--color-border-strong)", color: "var(--color-fg)" }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-fg)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border-strong)"; }}>
                  {showDetailed ? "Hide report" : "Detailed report"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results area — detection + form + detailed */}
      {hasAnalyzed && (
        <section className="max-w-6xl mx-auto px-6 pb-24 space-y-12">
          <AutoDetectPanel detected={detected} domain={domain} status={scanStatus} dns={dnsInfo} />

          {showForm && inputs && (
            <div key={`form-${inputs.domain}-${inputs.monthlyPageviews}`} className="animate-fade-up">
              <InputForm detected={detected} inputs={inputs} onSubmit={handleRefine} />
            </div>
          )}

          {showDetailed && result && inputs && (
            <div key={`report-${result.recommendedWorkers}-${result.maxConcurrentUsers}`} className="animate-fade-up delay-100">
              <DetailedReport result={result} inputs={inputs} />
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {!hasAnalyzed && (
        <section className="max-w-6xl mx-auto px-6 pb-24">
          <div className="border-t pt-12 grid grid-cols-1 md:grid-cols-3 gap-8" style={{ borderColor: "var(--color-border)" }}>
            {[
              { num: "01", title: "Enter URL", desc: "Paste your domain. We scan DNS, detect CMS, all plugins, theme, PHP version, and performance metrics." },
              { num: "02", title: "Auto-calculate", desc: "We detect everything and instantly calculate the exact PHP workers you need — no manual input required." },
              { num: "03", title: "Refine if needed", desc: "Not happy with the estimate? Click 'Refine calculation' to adjust traffic and configuration." },
            ].map((step) => (
              <div key={step.num} className="space-y-3">
                <span className="font-display text-4xl font-medium" style={{ color: "var(--color-fg-muted)" }}>{step.num}</span>
                <h3 className="font-display text-lg font-medium">{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--color-fg-secondary)" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>MIT License. No data leaves your browser.</p>
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
