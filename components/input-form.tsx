"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalculatorInputs, DetectedTech } from "@/types";
import { BarChart3, Loader2 } from "lucide-react";

const schema = z.object({
  domain: z.string().min(1, "Required"),
  monthlyPageviews: z.preprocess((val) => Number(val), z.number().min(1)),
  monthlyUniqueVisitors: z.preprocess((val) => Number(val), z.number().min(1)),
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
  inputs: CalculatorInputs;
  onSubmit: (inputs: CalculatorInputs) => void;
}

export default function InputForm({ detected, inputs, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      domain: inputs.domain,
      monthlyPageviews: inputs.monthlyPageviews,
      monthlyUniqueVisitors: inputs.monthlyUniqueVisitors,
      pagesPerSession: inputs.pagesPerSession,
      peakConcurrentUsers: inputs.peakConcurrentUsers,
      peakPercentageOfDaily: inputs.peakPercentageOfDaily,
      siteType: inputs.siteType,
      dynamicContentPercent: inputs.dynamicContentPercent,
      loggedInTrafficPercent: inputs.loggedInTrafficPercent,
      adminUserCount: inputs.adminUserCount,
      activePluginCount: inputs.activePluginCount,
      objectCacheEnabled: inputs.objectCacheEnabled,
      cdnEnabled: inputs.cdnEnabled,
      currentWorkerLimit: inputs.currentWorkerLimit,
      avgPhpResponseTimeMs: inputs.avgPhpResponseTimeMs,
    },
  });

  useEffect(() => {
    reset({
      domain: inputs.domain,
      monthlyPageviews: inputs.monthlyPageviews,
      monthlyUniqueVisitors: inputs.monthlyUniqueVisitors,
      pagesPerSession: inputs.pagesPerSession,
      peakConcurrentUsers: inputs.peakConcurrentUsers,
      peakPercentageOfDaily: inputs.peakPercentageOfDaily,
      siteType: inputs.siteType,
      dynamicContentPercent: inputs.dynamicContentPercent,
      loggedInTrafficPercent: inputs.loggedInTrafficPercent,
      adminUserCount: inputs.adminUserCount,
      activePluginCount: inputs.activePluginCount,
      objectCacheEnabled: inputs.objectCacheEnabled,
      cdnEnabled: inputs.cdnEnabled,
      currentWorkerLimit: inputs.currentWorkerLimit,
      avgPhpResponseTimeMs: inputs.avgPhpResponseTimeMs,
    });
  }, [inputs, reset]);

  const onFormSubmit = (data: FormData) => {
    const fullInputs: CalculatorInputs = {
      ...data,
      detectedTech: detected,
    };
    onSubmit(fullInputs);
  };

  const Field = ({
    label,
    error,
    children,
    className = "",
  }: {
    label: string;
    error?: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <div className={`space-y-1.5 ${className}`}>
      <label className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-muted)" }}>
        {label}
      </label>
      {children}
      {error && <p className="text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <div
        className="border-t pt-8 space-y-10"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-medium tracking-tight">Refine calculation</h3>
          <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
            Adjust defaults to match your real numbers
          </p>
        </div>

        {/* Traffic */}
        <div className="space-y-4">
          <h4 className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
            Traffic
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Domain" error={errors.domain?.message}>
              <input {...register("domain")} className="w-full" />
            </Field>
            <Field label="Monthly pageviews">
              <input type="number" {...register("monthlyPageviews")} className="w-full" />
            </Field>
            <Field label="Unique visitors">
              <input type="number" {...register("monthlyUniqueVisitors")} className="w-full" />
            </Field>
            <Field label="Pages / session">
              <input type="number" step="0.1" {...register("pagesPerSession")} className="w-full" />
            </Field>
            <Field label="Peak concurrent">
              <input
                type="number"
                {...register("peakConcurrentUsers", { setValueAs: (v) => (v === "" || v === null ? null : Number(v)) })}
                className="w-full"
                placeholder="Auto"
              />
            </Field>
            <Field label="Peak % of daily">
              <input type="number" {...register("peakPercentageOfDaily")} className="w-full" />
            </Field>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-4">
          <h4 className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
            Configuration
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Site type">
              <select {...register("siteType")} className="w-full">
                <option value="blog">Blog / Content</option>
                <option value="woocommerce">WooCommerce</option>
                <option value="membership">Membership</option>
                <option value="lms">LMS / Course</option>
                <option value="directory">Directory / Booking</option>
                <option value="saas">SaaS / Web App</option>
                <option value="mixed">Mixed</option>
              </select>
            </Field>
            <Field label="Active plugins">
              <input type="number" {...register("activePluginCount")} className="w-full" />
            </Field>
            <Field label="Admin users">
              <input type="number" {...register("adminUserCount")} className="w-full" />
            </Field>
            <Field label="Object cache">
              <select {...register("objectCacheEnabled")} className="w-full">
                <option value="unknown">Unknown</option>
                <option value="yes">Yes (Redis/Memcached)</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="CDN">
              <select {...register("cdnEnabled")} className="w-full">
                <option value="unknown">Unknown</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </Field>
            <Field label="Current worker limit">
              <input
                type="number"
                {...register("currentWorkerLimit", { setValueAs: (v) => (v === "" || v === null ? null : Number(v)) })}
                className="w-full"
                placeholder="N/A"
              />
            </Field>
          </div>
        </div>

        {/* Performance */}
        <div className="space-y-4">
          <h4 className="text-xs font-medium tracking-widest uppercase" style={{ color: "var(--color-fg-secondary)" }}>
            Performance
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Dynamic content %">
              <Controller
                name="dynamicContentPercent"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={100} {...field} className="flex-1" />
                    <span className="text-sm font-mono w-12 text-right">{field.value}%</span>
                  </div>
                )}
              />
            </Field>
            <Field label="Logged-in traffic %">
              <Controller
                name="loggedInTrafficPercent"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={100} {...field} className="flex-1" />
                    <span className="text-sm font-mono w-12 text-right">{field.value}%</span>
                  </div>
                )}
              />
            </Field>
            <Field label="Avg PHP response (ms)">
              <input type="number" {...register("avgPhpResponseTimeMs")} className="w-full" />
            </Field>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium tracking-wide uppercase transition-all disabled:opacity-40"
            style={{
              background: "var(--color-fg)",
              color: "var(--color-bg)",
            }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
            Recalculate
          </button>
          <p className="text-xs" style={{ color: "var(--color-fg-muted)" }}>
            Updates instantly in your browser
          </p>
        </div>
      </div>
    </form>
  );
}
