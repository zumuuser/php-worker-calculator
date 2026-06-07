import { CalculatorInputs, CalculationResult, WorkerBreakdown, DetectedTech } from "@/types";

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

  if (!inputs.detectedTech.isPhpSite) {
    tips.push("This site does not appear to use PHP. PHP workers only apply to PHP-based platforms like WordPress, Magento, Drupal, Laravel, etc.");
    return tips;
  }

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

function inferSiteType(detected: DetectedTech): CalculatorInputs["siteType"] {
  if (detected.hasWooCommerce || detected.cms === "Shopify" || detected.cms === "Magento") return "woocommerce";
  if (detected.hasLearnDash || detected.plugins.some((p) => ["lifterlms", "tutorlms", "sensei-lms"].includes(p.slug))) return "lms";
  if (detected.hasMemberPress || detected.hasBuddyBoss || detected.plugins.some((p) => ["pmpro", "restrict-content-pro", "woocommerce-memberships"].includes(p.slug))) return "membership";
  if (detected.cms === "Drupal" || detected.cms === "Joomla") return "mixed";
  if (detected.cms === "Ghost" || detected.cms === "Next.js" || detected.cms === "Astro" || detected.cms === "Gatsby") return "blog";
  if (detected.plugins.some((p) => p.category === "ecommerce")) return "woocommerce";
  if (detected.plugins.some((p) => p.category === "membership" || p.category === "lms")) return "membership";
  return "blog";
}

function estimateTraffic(detected: DetectedTech): { pageviews: number; visitors: number; confidence: 'low' | 'medium' | 'high'; source: string } {
  // If we have a sitemap with real pages, use page count as primary signal
  if (detected.estimatedPages > 10) {
    const perPage = detected.isPhpSite && detected.hasWooCommerce ? 1500 : 800;
    const pageviews = detected.estimatedPages * perPage;
    return {
      pageviews: Math.min(pageviews, 50_000_000),
      visitors: Math.floor(Math.min(pageviews, 50_000_000) * 0.5),
      confidence: 'medium',
      source: `Estimated from ${detected.estimatedPages.toLocaleString()} pages detected in sitemap`,
    };
  }

  // Enterprise indicators: major CDN, many scripts, analytics
  const hasEnterpriseCdn = detected.hasCloudflare || (detected.serverSoftware && detected.serverSoftware.toLowerCase().includes("akamai"));
  const hasManyScripts = detected.scripts.length > 15;
  const hasAnalytics = detected.analytics.length > 0;
  const isMajorSite = hasEnterpriseCdn && (hasManyScripts || hasAnalytics);

  // No sitemap — use CMS heuristics with much higher baselines
  if (detected.cms === "Shopify" || detected.cms === "Magento") {
    const base = isMajorSite ? 5_000_000 : 1_000_000;
    return {
      pageviews: base,
      visitors: Math.floor(base * 0.5),
      confidence: 'low',
      source: 'E-commerce baseline estimate (no sitemap detected)',
    };
  }

  if (detected.cms === "Next.js" || detected.cms === "Gatsby" || detected.cms === "Nuxt" || detected.cms === "SvelteKit") {
    const base = isMajorSite ? 10_000_000 : 1_000_000;
    return {
      pageviews: base,
      visitors: Math.floor(base * 0.5),
      confidence: 'low',
      source: `Jamstack baseline estimate (no sitemap detected${isMajorSite ? ', enterprise indicators present' : ''})`,
    };
  }

  if (detected.isPhpSite) {
    const base = isMajorSite ? 3_000_000 : 500_000;
    return {
      pageviews: base,
      visitors: Math.floor(base * 0.5),
      confidence: 'low',
      source: `PHP site baseline estimate (no sitemap detected${isMajorSite ? ', enterprise indicators present' : ''})`,
    };
  }

  const base = isMajorSite ? 2_000_000 : 500_000;
  return {
    pageviews: base,
    visitors: Math.floor(base * 0.5),
    confidence: 'low',
    source: `Generic baseline estimate (no sitemap detected${isMajorSite ? ', enterprise indicators present' : ''})`,
  };
}

export function buildAutoInputs(detected: DetectedTech, domain: string): CalculatorInputs {
  const siteType = inferSiteType(detected);
  const traffic = estimateTraffic(detected);

  let dynamicContentPercent = 20;
  let loggedInTrafficPercent = 5;

  if (siteType === "woocommerce") dynamicContentPercent = 40;
  if (siteType === "lms") { dynamicContentPercent = 50; loggedInTrafficPercent = 30; }
  if (siteType === "membership") { dynamicContentPercent = 50; loggedInTrafficPercent = 30; }
  if (siteType === "mixed") dynamicContentPercent = 30;

  const activePluginCount = Math.max(10, detected.plugins.length * 2);

  return {
    domain,
    monthlyPageviews: traffic.pageviews,
    monthlyUniqueVisitors: traffic.visitors,
    pagesPerSession: 2.5,
    peakConcurrentUsers: null,
    peakPercentageOfDaily: 20,
    siteType,
    dynamicContentPercent,
    loggedInTrafficPercent,
    adminUserCount: 1,
    activePluginCount,
    objectCacheEnabled: detected.cachePlugin ? "yes" : "unknown",
    cdnEnabled: detected.hasCloudflare ? "yes" : "unknown",
    currentWorkerLimit: null,
    avgPhpResponseTimeMs: detected.ttfb && detected.ttfb > 0 ? detected.ttfb : 300,
    detectedTech: detected,
  };
}

export function calculateWorkers(inputs: CalculatorInputs): CalculationResult {
  const { monthlyPageviews, monthlyUniqueVisitors, pagesPerSession, peakConcurrentUsers, peakPercentageOfDaily, siteType, dynamicContentPercent, loggedInTrafficPercent, adminUserCount, activePluginCount, objectCacheEnabled, cdnEnabled, avgPhpResponseTimeMs, detectedTech } = inputs;

  const avgSessionDurationMin = 2.5;
  const sessionsPerMonth = monthlyUniqueVisitors;
  const sessionsPerDay = sessionsPerMonth / 30;
  const concurrentFromTraffic = (sessionsPerDay * avgSessionDurationMin) / (24 * 60) * pagesPerSession;
  const peakFromPercentage = sessionsPerDay * (peakPercentageOfDaily / 100);
  const estimatedPeak = peakConcurrentUsers ?? Math.max(Math.round(concurrentFromTraffic * 3), Math.round(peakFromPercentage));
  const peak = Math.max(estimatedPeak, 1);

  const requestsPerWorker = 25;
  const baseWorkers = Math.ceil(peak / requestsPerWorker);

  const siteTypeMultiplier = SITE_TYPE_MULTIPLIERS[siteType] ?? 1.5;
  const dynamicFactor = 1 + (dynamicContentPercent / 100);
  const loggedInFactor = 1 + (loggedInTrafficPercent / 100) * 0.5;

  let cacheEfficiency = 1.0;
  if (objectCacheEnabled === "no") cacheEfficiency += 0.3;
  if (cdnEnabled === "no") cacheEfficiency += 0.1;
  if (!detectedTech.cachePlugin) cacheEfficiency += 0.15;

  const pluginOverhead = Math.ceil((activePluginCount + detectedTech.heavyPluginsCount) / 5);
  const adminOverhead = Math.ceil(adminUserCount / 5);

  let performanceOverhead = 0;
  if (avgPhpResponseTimeMs > 800) performanceOverhead += Math.ceil(baseWorkers * 0.2);
  if (avgPhpResponseTimeMs > 500) performanceOverhead += Math.ceil(baseWorkers * 0.1);
  if (detectedTech.ttfb && detectedTech.ttfb > 800) performanceOverhead += Math.ceil(baseWorkers * 0.15);

  const rawWorkers = Math.ceil(
    (baseWorkers * siteTypeMultiplier * dynamicFactor * loggedInFactor * cacheEfficiency) +
    pluginOverhead + adminOverhead + performanceOverhead
  );

  const burstHeadroom = Math.ceil(rawWorkers * 0.25);
  const recommendedWorkers = rawWorkers + burstHeadroom;

  const effectiveWorkers = recommendedWorkers;
  const maxConcurrentUsers = Math.floor(effectiveWorkers * requestsPerWorker / (siteTypeMultiplier * dynamicFactor * loggedInFactor * cacheEfficiency));
  const maxMonthlyPageviews = Math.floor(maxConcurrentUsers * (24 * 60 / avgSessionDurationMin) * 30 * pagesPerSession);

  const breakdown: WorkerBreakdown[] = [
    { label: "Base Traffic", workers: baseWorkers, color: "#0a0a0a" },
    { label: "Site Type", workers: Math.ceil(baseWorkers * (siteTypeMultiplier - 1)), color: "#525252" },
    { label: "Dynamic Content", workers: Math.ceil(baseWorkers * (dynamicFactor - 1) * siteTypeMultiplier), color: "#737373" },
    { label: "Logged-in Users", workers: Math.ceil(baseWorkers * (loggedInFactor - 1) * siteTypeMultiplier * dynamicFactor), color: "#a3a3a3" },
    { label: "Cache Efficiency", workers: Math.ceil(baseWorkers * (cacheEfficiency - 1) * siteTypeMultiplier * dynamicFactor * loggedInFactor), color: "#d4d4d4" },
    { label: "Plugin Overhead", workers: pluginOverhead, color: "#e5e5e5" },
    { label: "Admin Overhead", workers: adminOverhead, color: "#f0f0f0" },
    { label: "Performance", workers: performanceOverhead, color: "#fafafa" },
    { label: "Burst Headroom", workers: burstHeadroom, color: "#ffffff" },
  ];

  const trafficEstimate = estimateTraffic(detectedTech);

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
    isPhpSite: detectedTech.isPhpSite,
    trafficEstimate,
  };

  result.optimizationTips = getOptimizationTips(inputs, result);
  return result;
}
