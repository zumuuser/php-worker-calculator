import { DetectedTech, ScanStatus } from "@/types";
import { analyzeDns, DnsInfo } from "./dns";

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

const HEAVY_PLUGINS = [
  "woocommerce", "elementor", "memberpress", "learndash",
  "buddyboss", "buddypress", "gravityforms", "wpforms",
  "restrict-content", "pmpro", "lifterlms", "tutorlms",
  "easy-digital-downloads", "wp-ecommerce", "bbpress",
  "eventon", "the-events-calendar", "booking",
  "advanced-custom-fields", "acf-", "jetpack",
  "slider-revolution", "revslider", "wp-bakery",
  "divi-builder", "fusion-builder", "beaver",
];

const CACHE_PLUGINS = [
  "wp-rocket", "w3-total-cache", "litespeed-cache",
  "wp-super-cache", "wp-fastest-cache", "cache-enabler",
  "swift-performance", "borlabs-cache", "comet-cache",
  "hyper-cache", "redis-cache", "wp-redis",
];

async function fetchViaProxy(url: string): Promise<{ text: string; headers: Headers; proxy: string } | null> {
  for (const proxyFn of CORS_PROXIES) {
    const proxyUrl = proxyFn(url);
    try {
      const res = await fetch(proxyUrl, { cache: "no-store" });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length < 100) continue;
      return { text, headers: res.headers, proxy: proxyUrl.split("?")[0] };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchDirect(url: string): Promise<{ text: string; headers: Headers } | null> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) return null;
    return { text: await res.text(), headers: res.headers };
  } catch {
    return null;
  }
}

function detectCmsAndPlugins(html: string, headers: Headers): Partial<DetectedTech> & { cms: string | null; frameworks: string[] } {
  const lower = html.toLowerCase();
  const has = (str: string) => lower.includes(str.toLowerCase());
  const frameworks: string[] = [];
  let cms: string | null = null;

  // CMS
  if (has("wp-content") || has("wp-includes") || has("wp-json") || has('generator" content="wordpress') || has("/wp-")) {
    cms = "WordPress";
  } else if (has("shopify") || has("myshopify") || has("cdn.shopify") || has("Shopify.theme")) {
    cms = "Shopify";
  } else if (has("webflow") || has("data-wf-domain") || has("w-nav")) {
    cms = "Webflow";
  } else if (has("squarespace") || has("static.squarespace") || has("squarespace-cdn")) {
    cms = "Squarespace";
  } else if (has("wix") || has("wix-image") || has("static.wixstatic")) {
    cms = "Wix";
  } else if (has("drupal") || has("sites/default")) {
    cms = "Drupal";
  } else if (has("joomla") || has("/media/jui") || has("/templates/")) {
    cms = "Joomla";
  } else if (has("magento") || has("mage-") || has("amasty")) {
    cms = "Magento";
  } else if (has("ghost") || has("@tryghost")) {
    cms = "Ghost";
  } else if (has("next.js") || has("__next") || has("/_next/static")) {
    cms = "Next.js";
  } else if (has("gatsby") || has("___gatsby")) {
    cms = "Gatsby";
  } else if (has("astro")) {
    cms = "Astro";
  }

  // Frameworks
  if (has("react") || has("data-reactroot") || has("__react")) frameworks.push("React");
  if (has("next.js") || has("__next") || has("/_next/static")) frameworks.push("Next.js");
  if (has("vue.js") || has("__vue") || has("data-v-")) frameworks.push("Vue");
  if (has("nuxt") || has("__nuxt")) frameworks.push("Nuxt");
  if (has("angular") || has("ng-app") || has("ng-version")) frameworks.push("Angular");
  if (has("svelte") || has("svelte-")) frameworks.push("Svelte");
  if (has("remix") || has("__remix")) frameworks.push("Remix");
  if (has("jquery") || has("jquery.js") || has("jquery.min.js")) frameworks.push("jQuery");

  // WordPress plugins
  const detected: Partial<DetectedTech> = {
    isWordPress: cms === "WordPress",
    hasWooCommerce: has("woocommerce") || has("wc-") || has("wc_cart_fragments") || has("wc_add_to_cart"),
    hasElementor: has("elementor") || has("elementor-"),
    hasMemberPress: has("memberpress") || has("mepr-") || has("mepr_"),
    hasLearnDash: has("learndash") || has("ld-") || has("learndash-wrapper"),
    hasBuddyBoss: has("buddyboss") || has("buddypress") || has("bp-"),
    hasContactForm7: has("contact-form-7") || has("wpcf7") || has("wpcf7_"),
    hasGravityForms: has("gravityforms") || has("gform") || has("gforms_"),
    hasYoast: has("yoast") || has("yoast-seo"),
    hasRankMath: has("rank-math") || has("rankmath") || has("rank-math-seo"),
    hasWPRocket: has("wp-rocket"),
    hasW3TotalCache: has("w3-total-cache"),
    hasLiteSpeedCache: has("litespeed-cache") || has("litespeed"),
    hasCloudflare: has("cloudflare") || has("__cf") || has("cf-ray") || has("cf-browser-verification"),
  };

  const cfHeader = headers.get("cf-ray") || headers.get("server") || "";
  if (cfHeader.toLowerCase().includes("cloudflare")) {
    detected.hasCloudflare = true;
  }

  let heavyCount = 0;
  HEAVY_PLUGINS.forEach((p) => { if (has(p)) heavyCount++; });
  detected.heavyPluginsCount = heavyCount;

  let cachePlugin: string | null = null;
  for (const cp of CACHE_PLUGINS) {
    if (has(cp)) { cachePlugin = cp; break; }
  }
  detected.cachePlugin = cachePlugin;

  return { ...detected, cms, frameworks };
}

async function fetchSitemap(domain: string, proxyUsed: string | null): Promise<{ count: number; lastmods: string[] } | null> {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  const paths = ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap-index.xml"];

  for (const p of paths) {
    try {
      const url = new URL(p, base).toString();
      let text: string;

      if (proxyUsed) {
        const proxyRes = await fetch(`${proxyUsed}${proxyUsed.includes("allorigins") ? "?url=" : "?url="}${encodeURIComponent(url)}`, { cache: "no-store" });
        if (!proxyRes.ok) continue;
        text = await proxyRes.text();
      } else {
        const direct = await fetchDirect(url);
        if (!direct) continue;
        text = direct.text;
      }

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

async function fetchPageSpeed(domain: string): Promise<{ ttfb: number | null; lcp: number | null; cls: number | null }> {
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

export interface AnalysisResult {
  tech: DetectedTech;
  status: ScanStatus;
  dns: DnsInfo;
}

export async function analyzeSite(domain: string): Promise<AnalysisResult> {
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const baseUrl = `https://${cleanDomain}`;

  const base: DetectedTech = {
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

  const status: ScanStatus = {
    homepageFetched: false,
    sitemapFetched: false,
    pageSpeedFetched: false,
    dnsFetched: false,
    proxyUsed: null,
  };

  // DNS (always works)
  const dns = await analyzeDns(cleanDomain);
  status.dnsFetched = dns.nameservers.length > 0 || dns.aRecords.length > 0;

  // Try homepage fetch
  let html: string | null = null;
  let headers = new Headers();

  const direct = await fetchDirect(baseUrl);
  if (direct) {
    html = direct.text;
    headers = direct.headers;
    status.homepageFetched = true;
  } else {
    const proxy = await fetchViaProxy(baseUrl);
    if (proxy) {
      html = proxy.text;
      headers = proxy.headers;
      status.homepageFetched = true;
      status.proxyUsed = proxy.proxy;
    }
  }

  if (html) {
    const detected = detectCmsAndPlugins(html, headers);
    Object.assign(base, detected);
  }

  // Use DNS CDN info to supplement Cloudflare detection
  if (dns.cdnProvider === "Cloudflare" || dns.cdnProvider === "Akamai") {
    base.hasCloudflare = true;
  }

  // Try sitemap
  const sitemap = await fetchSitemap(cleanDomain, status.proxyUsed);
  if (sitemap) {
    base.estimatedPages = sitemap.count;
    status.sitemapFetched = true;
  }

  // PageSpeed Insights
  const psi = await fetchPageSpeed(cleanDomain);
  base.ttfb = psi.ttfb;
  base.lcp = psi.lcp;
  base.cls = psi.cls;
  status.pageSpeedFetched = psi.ttfb !== null || psi.lcp !== null;

  return { tech: base, status, dns };
}
