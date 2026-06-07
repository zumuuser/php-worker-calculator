import { CalculatorInputs, CalculationResult, WorkerBreakdown } from "@/types";

const SITE_TYPE_MULTIPLIERS: Record<string, number> = {
  blog: 1.0,
  woocommerce: 2.5,
  membership: 3.5,
  lms: 3.5,
  directory: 2.0,
  saas: 2.5,
  mixed: 2.0,
};

function getTier(workers: number): string {
  if (workers <= 5) return "Starter";
  if (workers <= 10) return "Growth";
  if (workers <= 20) return "Business";
  if (workers <= 40) return "Scale";
  if (workers <= 70) return "Enterprise Small";
  if (workers <= 110) return "Enterprise Large";
  return "Custom / Dedicated";
}

function getOptimizationTips(inputs: CalculatorInputs, result: CalculationResult): string[] {
  const tips: string[] = [];

  if (inputs.objectCacheEnabled !== "yes") {
    tips.push("Enable an object cache (Redis/Memcached) — this alone can reduce worker needs by 30%.");
  }

  if (inputs.cdnEnabled !== "yes") {
    tips.push("Add a CDN to offload static assets and reduce origin server load.");
  }

  if (!inputs.detectedTech.cachePlugin) {
    tips.push("Install a page caching plugin (WP Rocket, LiteSpeed Cache, or WP Super Cache).");
  }

  if (inputs.detectedTech.heavyPluginsCount > 5) {
    tips.push(`You have ${inputs.detectedTech.heavyPluginsCount} heavy plugins detected. Review and deactivate unused plugins to free up workers.`);
  }

  if (inputs.avgPhpResponseTimeMs > 500) {
    tips.push(`Your PHP response time (${inputs.avgPhpResponseTimeMs}ms) is high. Optimize database queries and consider query caching.`);
  }

  if (inputs.loggedInTrafficPercent > 30) {
    tips.push(`${inputs.loggedInTrafficPercent}% logged-in traffic bypasses page cache. Consider fragment caching for dynamic user-specific content.`);
  }

  if (inputs.dynamicContentPercent > 50) {
    tips.push(`${inputs.dynamicContentPercent}% dynamic content is significant. Implement Edge caching or full-page caching where possible.`);
  }

  if (inputs.siteType === "woocommerce") {
    tips.push("WooCommerce sites benefit heavily from object caching and database query optimization. Consider a dedicated checkout page cache strategy.");
  }

  if (inputs.adminUserCount > 10) {
    tips.push(`${inputs.adminUserCount} admin users increase backend load. Schedule bulk admin tasks during low-traffic hours.`);
  }

  if (inputs.detectedTech.ttfb && inputs.detectedTech.ttfb > 800) {
    tips.push(`TTFB is ${inputs.detectedTech.ttfb}ms — optimize server response time with better hosting or caching.`);
  }

  if (result.recommendedWorkers > 50) {
    tips.push("At this scale, consider separating admin traffic to a staging environment or dedicated admin node.");
  }

  if (tips.length === 0) {
    tips.push("Your setup looks well-optimized! Focus on monitoring peak traffic and scaling proactively.");
  }

  return tips;
}

export function calculateWorkers(inputs: CalculatorInputs): CalculationResult {
  const { monthlyPageviews, monthlyUniqueVisitors, pagesPerSession, peakConcurrentUsers, peakPercentageOfDaily, siteType, dynamicContentPercent, loggedInTrafficPercent, adminUserCount, activePluginCount, objectCacheEnabled, cdnEnabled, avgPhpResponseTimeMs, detectedTech } = inputs;

  // 1. Estimate peak concurrent users if not provided
  const avgSessionDurationMin = 2.5;
  const sessionsPerMonth = monthlyUniqueVisitors;
  const sessionsPerDay = sessionsPerMonth / 30;
  const concurrentFromTraffic = (sessionsPerDay * avgSessionDurationMin) / (24 * 60) * pagesPerSession;
  const peakFromPercentage = sessionsPerDay * (peakPercentageOfDaily / 100);
  const estimatedPeak = peakConcurrentUsers ?? Math.max(Math.round(concurrentFromTraffic * 3), Math.round(peakFromPercentage));
  const peak = Math.max(estimatedPeak, 1);

  // 2. Base workers (1 worker handles ~25 concurrent cached requests)
  const requestsPerWorker = 25;
  const baseWorkers = Math.ceil(peak / requestsPerWorker);

  // 3. Site type multiplier
  const siteTypeMultiplier = SITE_TYPE_MULTIPLIERS[siteType] ?? 1.5;

  // 4. Dynamic content factor (linear scale)
  const dynamicFactor = 1 + (dynamicContentPercent / 100);

  // 5. Logged-in traffic factor
  const loggedInFactor = 1 + (loggedInTrafficPercent / 100) * 0.5;

  // 6. Cache efficiency
  let cacheEfficiency = 1.0;
  if (objectCacheEnabled === "no") cacheEfficiency += 0.3;
  if (cdnEnabled === "no") cacheEfficiency += 0.1;
  if (!detectedTech.cachePlugin) cacheEfficiency += 0.15;

  // 7. Plugin overhead
  const pluginOverhead = Math.ceil((activePluginCount + detectedTech.heavyPluginsCount) / 5);

  // 8. Admin overhead
  const adminOverhead = Math.ceil(adminUserCount / 5);

  // 9. Performance overhead
  let performanceOverhead = 0;
  if (avgPhpResponseTimeMs > 800) performanceOverhead += Math.ceil(baseWorkers * 0.2);
  if (avgPhpResponseTimeMs > 500) performanceOverhead += Math.ceil(baseWorkers * 0.1);
  if (detectedTech.ttfb && detectedTech.ttfb > 800) performanceOverhead += Math.ceil(baseWorkers * 0.15);

  // 10. Raw workers before headroom
  const rawWorkers = Math.ceil(
    (baseWorkers * siteTypeMultiplier * dynamicFactor * loggedInFactor * cacheEfficiency) +
    pluginOverhead +
    adminOverhead +
    performanceOverhead
  );

  // 11. Burst headroom (+25%)
  const burstHeadroom = Math.ceil(rawWorkers * 0.25);
  const recommendedWorkers = rawWorkers + burstHeadroom;

  // 12. Capacity reverse-calculation
  const effectiveWorkers = recommendedWorkers;
  const maxConcurrentUsers = Math.floor(effectiveWorkers * requestsPerWorker / (siteTypeMultiplier * dynamicFactor * loggedInFactor * cacheEfficiency));
  const maxMonthlyPageviews = Math.floor(maxConcurrentUsers * (24 * 60 / avgSessionDurationMin) * 30 * pagesPerSession);

  const breakdown: WorkerBreakdown[] = [
    { label: "Base Traffic", workers: baseWorkers, color: "#3b82f6" },
    { label: "Site Type", workers: Math.ceil(baseWorkers * (siteTypeMultiplier - 1)), color: "#8b5cf6" },
    { label: "Dynamic Content", workers: Math.ceil(baseWorkers * (dynamicFactor - 1) * siteTypeMultiplier), color: "#f59e0b" },
    { label: "Logged-in Users", workers: Math.ceil(baseWorkers * (loggedInFactor - 1) * siteTypeMultiplier * dynamicFactor), color: "#ef4444" },
    { label: "Cache Efficiency", workers: Math.ceil(baseWorkers * (cacheEfficiency - 1) * siteTypeMultiplier * dynamicFactor * loggedInFactor), color: "#10b981" },
    { label: "Plugin Overhead", workers: pluginOverhead, color: "#6366f1" },
    { label: "Admin Overhead", workers: adminOverhead, color: "#ec4899" },
    { label: "Performance", workers: performanceOverhead, color: "#f97316" },
    { label: "Burst Headroom", workers: burstHeadroom, color: "#14b8a6" },
  ];

  const result: CalculationResult = {
    recommendedWorkers,
    baseWorkers,
    dynamicMultiplier: dynamicFactor,
    cacheEfficiency,
    siteTypeMultiplier,
    pluginOverhead,
    adminOverhead,
    performanceOverhead,
    burstHeadroom,
    tier: getTier(recommendedWorkers),
    maxConcurrentUsers,
    maxMonthlyPageviews,
    breakdown,
    optimizationTips: [],
    projections: {
      traffic2x: Math.ceil(recommendedWorkers * 1.8),
      traffic5x: Math.ceil(recommendedWorkers * 3.5),
      traffic10x: Math.ceil(recommendedWorkers * 6),
    },
  };

  result.optimizationTips = getOptimizationTips(inputs, result);
  return result;
}
