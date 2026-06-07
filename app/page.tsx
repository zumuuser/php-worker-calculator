"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { CalculatorInputs, DetectedTech, CalculationResult, SavedReport } from "@/types";
import { calculateWorkers } from "@/lib/calculator";
import { saveReport } from "@/lib/storage";
import { analyzeSite } from "@/lib/scraper";
import UrlInput from "@/components/url-input";
import AutoDetectPanel from "@/components/auto-detect-panel";
import InputForm from "@/components/input-form";
import SimpleResult from "@/components/simple-result";
import DetailedReport from "@/components/detailed-report";
import HistoryDrawer from "@/components/history-drawer";
import { Cpu, Shield, Sparkles, Code2, CheckCircle2 } from "lucide-react";

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

export default function Home() {
  const [detected, setDetected] = useState<DetectedTech>(defaultDetected);
  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const resultRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = useCallback(async (domain: string) => {
    setAnalyzing(true);
    try {
      const tech = await analyzeSite(domain);
      setDetected(tech);
      setStep(2);
    } catch {
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleCalculate = useCallback((data: CalculatorInputs) => {
    setLoading(true);
    setInputs(data);
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
    setLoading(false);
    setStep(3);
  }, []);

  useEffect(() => {
    if (step === 3 && resultRef.current) {
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [step]);

  const handleLoadReport = useCallback((report: SavedReport) => {
    setDetected(report.inputs.detectedTech);
    setInputs(report.inputs);
    setResult(report.result);
    setShowHistory(false);
    setStep(3);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full" />

        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-20">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">PHP Worker Calculator</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowHistory(true)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                History
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <Code2 className="w-4 h-4" />
              </a>
            </div>
          </nav>

          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 text-sm font-medium text-blue-300 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Free & Open Source
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
              How many{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                PHP workers
              </span>{" "}
              do you need?
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Enter your website URL. We auto-detect your tech stack, analyze your traffic, and tell you exactly how many workers you need — no guesswork.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Respects robots.txt
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                100% client-side
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step Indicator */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 md:gap-4">
                <div
                  className={`flex items-center gap-2 rounded-full px-3 md:px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    step >= s
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      step >= s ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {s}
                  </span>
                  <span className="hidden md:inline">
                    {s === 1 ? "Analyze Site" : s === 2 ? "Enter Metrics" : "Get Results"}
                  </span>
                </div>
                {s < 3 && (
                  <div
                    className={`w-8 md:w-12 h-0.5 rounded-full transition-colors duration-300 ${
                      step > s ? "bg-blue-500" : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <UrlInput onAnalyze={handleAnalyze} analyzing={analyzing} />

        {step >= 2 && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <AutoDetectPanel detected={detected} />
          </div>
        )}

        {step >= 2 && (
          <div className="animate-in slide-in-from-bottom-4 duration-500 delay-100">
            <InputForm detected={detected} onSubmit={handleCalculate} loading={loading} />
          </div>
        )}

        {step >= 3 && result && inputs && (
          <div ref={resultRef} className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step 3</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Results</h2>
              </div>
            </div>
            <SimpleResult result={result} inputs={inputs} />
            <DetailedReport result={result} inputs={inputs} />
          </div>
        )}
      </div>

      <HistoryDrawer open={showHistory} onClose={() => setShowHistory(false)} onLoad={handleLoadReport} />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 mt-20 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Open source under MIT License. No data leaves your browser.
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <a href="https://github.com/zumuuser/php-worker-calculator/blob/main/docs/ARCHITECTURE.md" className="hover:text-slate-900 dark:hover:text-white transition-colors">Architecture</a>
            <a href="https://github.com/zumuuser/php-worker-calculator/blob/main/docs/FORMULA.md" className="hover:text-slate-900 dark:hover:text-white transition-colors">Formula</a>
            <a href="https://github.com/zumuuser/php-worker-calculator/blob/main/docs/CONTRIBUTING.md" className="hover:text-slate-900 dark:hover:text-white transition-colors">Contribute</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
