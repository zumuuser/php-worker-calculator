import { DetectedTech } from "@/types";

const HEAVY_PLUGINS = [
  "woocommerce", "elementor", "memberpress", "learndash",
  "buddyboss", "buddypress", "gravityforms", "wpforms",
  " Restrict Content", "pmpro", "lifterlms", "tutorlms",
  "easy-digital-downloads", "wp-ecommerce", "bbpress",
  "eventon", "the-events-calendar", "booking",
];

const CACHE_PLUGINS = [
  "wp-rocket", "w3-total-cache", "litespeed-cache",
  "wp-super-cache", "wp-fastest-cache", "cache-enabler",
  "swift-performance", "borlabs-cache", "comet-cache",
];

function detectFromHtml(html: string): Partial<DetectedTech> {
  const lower = html.toLowerCase();
  const text = html;

  const has = (str: string) => lower.includes(str.toLowerCase());

  const detected: Partial<DetectedTech> = {
    isWordPress: has("wp-content") || has("wp-includes") || has('/wp-json') || has('generator" content="wordpress'),
    hasWooCommerce: has("woocommerce") || has("wc-") || has("wc_cart_fragments"),
    hasElementor: has("elementor"),
    hasMemberPress: has("memberpress") || has("mepr-"),
    hasLearnDash: has("learndash") || has("ld-"),
    hasBuddyBoss: has("buddyboss") || has("buddypress"),
    hasContactForm7: has("contact-form-7") || has("wpcf7"),
    hasGravityForms: has("gravityforms") || has("gform"),
    hasYoast: has("yoast") || has("yoast-seo"),
    hasRankMath: has("rank-math") || has("rankmath"),
    hasWPRocket: has("wp-rocket"),
    hasW3TotalCache: has("w3-total-cache"),
    hasLiteSpeedCache: has("litespeed-cache"),
    hasCloudflare: has("cloudflare") || has("__cf") || has("cf-ray"),
  };

  let heavyCount = 0;
  HEAVY_PLUGINS.forEach((p) => {
    if (has(p)) heavyCount++;
  });
  detected.heavyPluginsCount = heavyCount;

  let cachePlugin: string | null = null;
  for (const cp of CACHE_PLUGINS) {
    if (has(cp)) {
      cachePlugin = cp;
      break;
    }
  }
  detected.cachePlugin = cachePlugin;

  return detected;
}

export async function fetchRobotsTxt(domain: string): Promise<string | null> {
  try {
    const url = new URL("/robots.txt", domain.startsWith("http") ? domain : `https://${domain}`).toString();
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export function isAllowedByRobots(robotsTxt: string | null, path: string): boolean {
  if (!robotsTxt) return true;
  const lines = robotsTxt.split("\n");
  let relevant = false;
  for (const raw of lines) {
    const line = raw.trim().toLowerCase();
    if (line.startsWith("user-agent:") && (line.includes("*") || line.includes("bot"))) {
      relevant = true;
    } else if (line.startsWith("user-agent:")) {
      relevant = false;
    }
    if (relevant && line.startsWith("disallow:")) {
      const dis = line.replace("disallow:", "").trim();
      if (dis === "/") return false;
      if (path.startsWith(dis)) return false;
    }
  }
  return true;
}

export async function fetchSitemap(domain: string): Promise<{ count: number; lastmods: string[] } | null> {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  const paths = ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap-index.xml"];

  for (const p of paths) {
    try {
      const url = new URL(p, base).toString();
      const res = await fetch(url, { mode: "cors", cache: "no-store" });
      if (!res.ok) continue;
      const text = await res.text();
      const urlMatches = text.match(/<url>/g);
      const count = urlMatches ? urlMatches.length : 0;
      const lastmods = [...text.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
      return { count: Math.min(count, 10000), lastmods: lastmods.slice(0, 10) };
    } catch {
      continue;
    }
  }
  return null;
}

export async function fetchHomepage(domain: string): Promise<string | null> {
  try {
    const url = new URL("/", domain.startsWith("http") ? domain : `https://${domain}`).toString();
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function fetchPageSpeed(domain: string): Promise<{ ttfb: number | null; lcp: number | null; cls: number | null }> {
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&strategy=desktop`;
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) return { ttfb: null, lcp: null, cls: null };
    const data = await res.json();
    const metrics = data?.lighthouseResult?.audits;
    const ttfbRaw = metrics?.["server-response-time"]?.numericValue ?? null;
    const lcpRaw = metrics?.["largest-contentful-paint"]?.numericValue ?? null;
    const clsRaw = metrics?.["cumulative-layout-shift"]?.numericValue ?? null;
    return {
      ttfb: ttfbRaw ? Math.round(ttfbRaw) : null,
      lcp: lcpRaw ? Math.round(lcpRaw) : null,
      cls: clsRaw ? Math.round(clsRaw * 100) / 100 : null,
    };
  } catch {
    return { ttfb: null, lcp: null, cls: null };
  }
}

export async function analyzeSite(domain: string): Promise<DetectedTech> {
  const base: DetectedTech = {
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

  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  const robots = await fetchRobotsTxt(cleanDomain);
  const homepageAllowed = isAllowedByRobots(robots, "/");
  const sitemapAllowed = isAllowedByRobots(robots, "/sitemap.xml");

  const [sitemap, html, psi] = await Promise.all([
    sitemapAllowed ? fetchSitemap(cleanDomain) : Promise.resolve(null),
    homepageAllowed ? fetchHomepage(cleanDomain) : Promise.resolve(null),
    fetchPageSpeed(cleanDomain),
  ]);

  if (html) {
    Object.assign(base, detectFromHtml(html));
  }

  if (sitemap) {
    base.estimatedPages = sitemap.count;
  }

  base.ttfb = psi.ttfb;
  base.lcp = psi.lcp;
  base.cls = psi.cls;

  return base;
}
