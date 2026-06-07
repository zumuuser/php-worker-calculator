"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalculatorInputs, DetectedTech } from "@/types";
import { Calculator, Loader2, Info, Users, Settings, Zap, BarChart3 } from "lucide-react";

const schema = z.object({
  domain: z.string().min(1, "Domain is required"),
  monthlyPageviews: z.preprocess((val) => Number(val), z.number().min(1, "Must be at least 1")),
  monthlyUniqueVisitors: z.preprocess((val) => Number(val), z.number().min(1, "Must be at least 1")),
  pagesPerSession: z.preprocess((val) => Number(val), z.number().min(1).max(50)).default(2.5),
  peakConcurrentUsers: z.preprocess((val) => (val === "" || val == null ? null : Number(val)), z.number().nullable()).default(null),
  peakPercentageOfDaily: z.preprocess((val) => Number(val), z.number().min(1).max(100)).default(20),
  siteType: z.enum(["blog", "woocommerce", "membership", "lms", "directory", "saas", "mixed"]),
  dynamicContentPercent: z.preprocess((val) => Number(val), z.number().min(0).max(100)).default(20),
  loggedInTrafficPercent: z.preprocess((val) => Number(val), z.number().min(0).max(100)).default(5),
  adminUserCount: z.preprocess((val) => Number(val), z.number().min(0)).default(1),
  activePluginCount: z.preprocess((val) => Number(val), z.number().min(0)).default(10),
  objectCacheEnabled: z.enum(["yes", "no", "unknown"]).default("unknown"),
  cdnEnabled: z.enum(["yes", "no", "unknown"]).default("unknown"),
  currentWorkerLimit: z.preprocess((val) => (val === "" || val == null ? null : Number(val)), z.number().nullable()).default(null),
  avgPhpResponseTimeMs: z.preprocess((val) => Number(val), z.number().min(50).max(10000)).default(300),
});

type FormData = z.infer<typeof schema>;

interface Props {
  detected: DetectedTech;
  onSubmit: (inputs: CalculatorInputs) => void;
  loading: boolean;
}

export default function InputForm({ detected, onSubmit, loading }: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      domain: "",
      monthlyPageviews: 30000,
      monthlyUniqueVisitors: 15000,
      pagesPerSession: 2.5,
      peakConcurrentUsers: null,
      peakPercentageOfDaily: 20,
      siteType: "blog",
      dynamicContentPercent: 20,
      loggedInTrafficPercent: 5,
      adminUserCount: 1,
      activePluginCount: 10,
      objectCacheEnabled: "unknown",
      cdnEnabled: "unknown",
      currentWorkerLimit: null,
      avgPhpResponseTimeMs: 300,
    },
  });

  useEffect(() => {
    if (detected.cachePlugin) {
      setValue("objectCacheEnabled", "yes");
    }
    if (detected.hasCloudflare) {
      setValue("cdnEnabled", "yes");
    }
    if (detected.hasWooCommerce) {
      setValue("siteType", "woocommerce");
      setValue("dynamicContentPercent", 40);
    } else if (detected.hasMemberPress || detected.hasLearnDash || detected.hasBuddyBoss) {
      setValue("siteType", detected.hasLearnDash ? "lms" : "membership");
      setValue("dynamicContentPercent", 50);
      setValue("loggedInTrafficPercent", 30);
    }
    if (detected.heavyPluginsCount > 0) {
      setValue("activePluginCount", Math.max(10, detected.heavyPluginsCount * 3));
    }
    if (detected.ttfb && detected.ttfb > 0) {
      setValue("avgPhpResponseTimeMs", detected.ttfb);
    }
  }, [detected, setValue]);

  const onFormSubmit = (data: FormData) => {
    const inputs: CalculatorInputs = {
      ...data,
      detectedTech: detected,
    };
    onSubmit(inputs);
  };

  const SectionHeader = ({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) => (
    <div className="flex items-start gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
      </div>
    </div>
  );

  const Field = ({
    label,
    tooltip,
    error,
    children,
  }: {
    label: string;
    tooltip?: string;
    error?: string;
    children: React.ReactNode;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1">
        {label}
        {tooltip && (
          <div className="group relative inline-flex">
            <Info className="w-3 h-3 text-slate-400 cursor-help" />
            <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 w-48 rounded-lg bg-slate-800 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {tooltip}
            </span>
          </div>
        )}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl shadow-slate-200/50 dark:shadow-none"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Enter Your Metrics</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fine-tune the calculation with your real traffic and configuration data.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {/* Traffic Section */}
        <div>
          <SectionHeader
            icon={<Users className="w-4 h-4 text-blue-500" />}
            title="Traffic"
            subtitle="How many people visit your site and how they behave"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label="Domain" error={errors.domain?.message}>
              <input
                {...register("domain")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                placeholder="example.com"
              />
            </Field>
            <Field label="Monthly Pageviews" tooltip="Total page loads per month">
              <input
                type="number"
                {...register("monthlyPageviews")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </Field>
            <Field label="Unique Visitors" tooltip="Distinct visitors per month">
              <input
                type="number"
                {...register("monthlyUniqueVisitors")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </Field>
            <Field label="Pages / Session">
              <input
                type="number"
                step="0.1"
                {...register("pagesPerSession")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </Field>
            <Field label="Peak Concurrent Users" tooltip="Leave blank to auto-estimate">
              <input
                type="number"
                {...register("peakConcurrentUsers", { setValueAs: (v) => (v === "" || v === null ? null : Number(v)) })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                placeholder="Auto"
              />
            </Field>
            <Field label="Peak % of Daily" tooltip="What % of daily traffic hits during peak hour">
              <input
                type="number"
                {...register("peakPercentageOfDaily")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </Field>
          </div>
        </div>

        {/* Site Configuration */}
        <div>
          <SectionHeader
            icon={<Settings className="w-4 h-4 text-violet-500" />}
            title="Site Configuration"
            subtitle="Your platform, plugins, and caching setup"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label="Site Type">
              <select
                {...register("siteType")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              >
                <option value="blog">Blog / Content</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="membership">Membership</option>
                <option value="lms">LMS / Course</option>
                <option value="directory">Directory / Booking</option>
                <option value="saas">SaaS / Web App</option>
                <option value="mixed">Mixed</option>
              </select>
            </Field>
            <Field label="Active Plugins" tooltip="Approximate number of active plugins">
              <input
                type="number"
                {...register("activePluginCount")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </Field>
            <Field label="Admin Users">
              <input
                type="number"
                {...register("adminUserCount")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </Field>
            <Field label="Object Cache">
              <select
                {...register("objectCacheEnabled")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              >
                <option value="unknown">Unknown</option>
                <option value="yes">Yes (Redis/Memcached)</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="CDN Enabled">
              <select
                {...register("cdnEnabled")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              >
                <option value="unknown">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Current Worker Limit" tooltip="If migrating from another host">
              <input
                type="number"
                {...register("currentWorkerLimit", { setValueAs: (v) => (v === "" || v === null ? null : Number(v)) })}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
                placeholder="N/A"
              />
            </Field>
          </div>
        </div>

        {/* Performance */}
        <div>
          <SectionHeader
            icon={<Zap className="w-4 h-4 text-amber-500" />}
            title="Performance"
            subtitle="How dynamic and slow your site is"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Field label="Dynamic Content %" tooltip="% of pages that can't be fully cached">
              <Controller
                name="dynamicContentPercent"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5">
                    <input type="range" min={0} max={100} {...field} className="flex-1 accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    <span className="text-sm font-bold font-mono w-12 text-right text-slate-900 dark:text-white">{field.value}%</span>
                  </div>
                )}
              />
            </Field>
            <Field label="Logged-in Traffic %" tooltip="Users who bypass page cache">
              <Controller
                name="loggedInTrafficPercent"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5">
                    <input type="range" min={0} max={100} {...field} className="flex-1 accent-blue-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer" />
                    <span className="text-sm font-bold font-mono w-12 text-right text-slate-900 dark:text-white">{field.value}%</span>
                  </div>
                )}
              />
            </Field>
            <Field label="Avg PHP Response (ms)">
              <input
                type="number"
                {...register("avgPhpResponseTimeMs")}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none transition-all"
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800">
        <button
          type="submit"
          disabled={loading}
          className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-10 py-4 text-base font-bold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-xl hover:shadow-emerald-600/20 active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Calculating...
            </>
          ) : (
            <>
              <BarChart3 className="w-5 h-5" />
              Calculate PHP Workers
            </>
          )}
        </button>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
          Results are calculated instantly in your browser. No data is sent to any server.
        </p>
      </div>
    </form>
  );
}
