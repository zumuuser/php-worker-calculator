import { DetectedTech, ScanStatus, DetectedPlugin } from "@/types";
import { DnsInfo, analyzeDns } from "./dns";
import { getApiKeys } from "./api-keys";

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

const PLUGIN_MAP: Record<string, { name: string; category: DetectedPlugin["category"] }> = {
  woocommerce: { name: "WooCommerce", category: "ecommerce" },
  "woo-commerce": { name: "WooCommerce", category: "ecommerce" },
  elementor: { name: "Elementor", category: "page-builder" },
  "elementor-pro": { name: "Elementor Pro", category: "page-builder" },
  memberpress: { name: "MemberPress", category: "membership" },
  learndash: { name: "LearnDash", category: "lms" },
  "sfwd-lms": { name: "LearnDash", category: "lms" },
  buddyboss: { name: "BuddyBoss", category: "membership" },
  buddypress: { name: "BuddyPress", category: "membership" },
  "contact-form-7": { name: "Contact Form 7", category: "forms" },
  wpcf7: { name: "Contact Form 7", category: "forms" },
  gravityforms: { name: "Gravity Forms", category: "forms" },
  "gravity-forms": { name: "Gravity Forms", category: "forms" },
  "wordpress-seo": { name: "Yoast SEO", category: "seo" },
  "yoast-seo": { name: "Yoast SEO", category: "seo" },
  "rank-math": { name: "Rank Math", category: "seo" },
  "wp-rocket": { name: "WP Rocket", category: "cache" },
  "w3-total-cache": { name: "W3 Total Cache", category: "cache" },
  "litespeed-cache": { name: "LiteSpeed Cache", category: "cache" },
  "wp-super-cache": { name: "WP Super Cache", category: "cache" },
  "wp-fastest-cache": { name: "WP Fastest Cache", category: "cache" },
  "cache-enabler": { name: "Cache Enabler", category: "cache" },
  "swift-performance": { name: "Swift Performance", category: "cache" },
  jetpack: { name: "Jetpack", category: "other" },
  akismet: { name: "Akismet", category: "security" },
  wordfence: { name: "Wordfence", category: "security" },
  sucuri: { name: "Sucuri", category: "security" },
  "advanced-custom-fields": { name: "Advanced Custom Fields", category: "other" },
  acf: { name: "Advanced Custom Fields", category: "other" },
  "slider-revolution": { name: "Slider Revolution", category: "page-builder" },
  revslider: { name: "Slider Revolution", category: "page-builder" },
  js_composer: { name: "WPBakery Page Builder", category: "page-builder" },
  wpbakery: { name: "WPBakery Page Builder", category: "page-builder" },
  "divi-builder": { name: "Divi Builder", category: "page-builder" },
  "fusion-builder": { name: "Fusion Builder", category: "page-builder" },
  "beaver-builder": { name: "Beaver Builder", category: "page-builder" },
  "the-events-calendar": { name: "The Events Calendar", category: "other" },
  eventon: { name: "EventON", category: "other" },
  "easy-digital-downloads": { name: "Easy Digital Downloads", category: "ecommerce" },
  "restrict-content-pro": { name: "Restrict Content Pro", category: "membership" },
  pmpro: { name: "Paid Memberships Pro", category: "membership" },
  lifterlms: { name: "LifterLMS", category: "lms" },
  tutorlms: { name: "Tutor LMS", category: "lms" },
  bbpress: { name: "bbPress", category: "membership" },
  wpforms: { name: "WPForms", category: "forms" },
  "ninja-forms": { name: "Ninja Forms", category: "forms" },
  formidable: { name: "Formidable Forms", category: "forms" },
  "mailchimp-for-wp": { name: "Mailchimp for WP", category: "other" },
  fluentform: { name: "Fluent Forms", category: "forms" },
  weglot: { name: "Weglot", category: "other" },
  polylang: { name: "Polylang", category: "other" },
  wpml: { name: "WPML", category: "other" },
  "google-analytics-for-wordpress": { name: "MonsterInsights", category: "analytics" },
  exactmetrics: { name: "ExactMetrics", category: "analytics" },
  redirection: { name: "Redirection", category: "seo" },
  "duplicate-post": { name: "Duplicate Post", category: "other" },
  updraftplus: { name: "UpdraftPlus", category: "backup" },
  backupbuddy: { name: "BackupBuddy", category: "backup" },
  "all-in-one-wp-migration": { name: "All-in-One WP Migration", category: "backup" },
  "wp-optimize": { name: "WP-Optimize", category: "cache" },
  tablepress: { name: "TablePress", category: "other" },
  "wp-migrate-db": { name: "WP Migrate DB", category: "backup" },
  "query-monitor": { name: "Query Monitor", category: "other" },
  "woocommerce-subscriptions": { name: "WooCommerce Subscriptions", category: "ecommerce" },
  "woocommerce-memberships": { name: "WooCommerce Memberships", category: "membership" },
  "essential-addons-for-elementor-lite": { name: "Essential Addons for Elementor", category: "page-builder" },
};

function extractPlugins(html: string): DetectedPlugin[] {
  const matches = [...html.matchAll(/wp-content\/plugins\/([^\/"'?\s]+)/gi)];
  const slugs = [...new Set(matches.map((m) => m[1].toLowerCase()))];
  return slugs.map((slug) => {
    const known = PLUGIN_MAP[slug];
    return {
      slug,
      name: known?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      category: known?.category || "other",
    };
  });
}

function extractThemes(html: string): string[] {
  const matches = [...html.matchAll(/wp-content\/themes\/([^\/"'?\s]+)/gi)];
  return [...new Set(matches.map((m) => m[1]))];
}

function detectWordPressVersion(html: string): string | null {
  const meta = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress\s+([0-9.]+)/i);
  if (meta) return meta[1];
  const other = html.match(/WordPress\s+([0-9.]+)/i);
  if (other) return other[1];
  return null;
}

function detectPhpVersion(headers: Headers): string | null {
  const powered = headers.get("x-powered-by") || "";
  const match = powered.match(/PHP\/([0-9.]+)/i);
  return match ? match[1] : null;
}

function detectServerSoftware(headers: Headers): string | null {
  return headers.get("server") || null;
}

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

function detectCmsAndPlugins(html: string, headers: Headers): Partial<DetectedTech> {
  const lower = html.toLowerCase();
  const has = (str: string) => lower.includes(str.toLowerCase());
  const frameworks: string[] = [];
  let cms: string | null = null;

  if (has("wp-content") || has("wp-includes") || has("wp-json") || has('generator" content="wordpress') || has("/wp-admin")) {
    cms = "WordPress";
  } else if (has("shopify") || has("myshopify") || has("cdn.shopify")) {
    cms = "Shopify";
  } else if (has("webflow") || has("data-wf-domain") || has("w-nav")) {
    cms = "Webflow";
  } else if (has("squarespace") || has("static.squarespace")) {
    cms = "Squarespace";
  } else if (has("wix") || has("wix-image") || has("static.wixstatic")) {
    cms = "Wix";
  } else if (has("drupal") || has("sites/default")) {
    cms = "Drupal";
  } else if (has("joomla") || has("/media/jui")) {
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

  if (has("react") || has("data-reactroot") || has("__react")) frameworks.push("React");
  if (has("next.js") || has("__next") || has("/_next/static")) frameworks.push("Next.js");
  if (has("vue.js") || has("__vue") || has("data-v-")) frameworks.push("Vue");
  if (has("nuxt") || has("__nuxt")) frameworks.push("Nuxt");
  if (has("angular") || has("ng-app") || has("ng-version")) frameworks.push("Angular");
  if (has("svelte") || has("svelte-")) frameworks.push("Svelte");
  if (has("remix") || has("__remix")) frameworks.push("Remix");
  if (has("jquery") || has("jquery.js")) frameworks.push("jQuery");

  const isWp = cms === "WordPress";
  const plugins = isWp ? extractPlugins(html) : [];
  const themes = isWp ? extractThemes(html) : [];
  const wpVersion = isWp ? detectWordPressVersion(html) : null;
  const phpVersion = detectPhpVersion(headers);
  const serverSoftware = detectServerSoftware(headers);
  const theme = themes.length > 0 ? themes[0] : null;

  const detected: Partial<DetectedTech> = {
    cms,
    cmsVersion: wpVersion,
    phpVersion,
    theme,
    themeVersion: null,
    isWordPress: isWp,
    hasWooCommerce: plugins.some((p) => p.slug === "woocommerce" || p.slug === "woo-commerce"),
    hasElementor: plugins.some((p) => p.slug === "elementor" || p.slug === "elementor-pro"),
    hasMemberPress: plugins.some((p) => p.slug === "memberpress"),
    hasLearnDash: plugins.some((p) => p.slug === "learndash" || p.slug === "sfwd-lms"),
    hasBuddyBoss: plugins.some((p) => p.slug === "buddyboss" || p.slug === "buddypress"),
    hasContactForm7: plugins.some((p) => p.slug === "contact-form-7" || p.slug === "wpcf7"),
    hasGravityForms: plugins.some((p) => p.slug === "gravityforms" || p.slug === "gravity-forms"),
    hasYoast: plugins.some((p) => p.slug === "wordpress-seo" || p.slug === "yoast-seo"),
    hasRankMath: plugins.some((p) => p.slug === "rank-math"),
    hasWPRocket: plugins.some((p) => p.slug === "wp-rocket"),
    hasW3TotalCache: plugins.some((p) => p.slug === "w3-total-cache"),
    hasLiteSpeedCache: plugins.some((p) => p.slug === "litespeed-cache"),
    hasCloudflare: has("cloudflare") || has("__cf") || has("cf-ray") || has("cf-browser-verification"),
    plugins,
    frameworks,
    serverSoftware,
  };

  const cfHeader = headers.get("cf-ray") || headers.get("server") || "";
  if (cfHeader.toLowerCase().includes("cloudflare")) {
    detected.hasCloudflare = true;
  }

  const heavyCats = ["ecommerce", "page-builder", "membership", "lms", "forms"];
  detected.heavyPluginsCount = plugins.filter((p) => heavyCats.includes(p.category)).length;

  const cacheSlugs = ["wp-rocket", "w3-total-cache", "litespeed-cache", "wp-super-cache", "wp-fastest-cache", "cache-enabler", "swift-performance"];
  const cachePlugin = plugins.find((p) => cacheSlugs.includes(p.slug));
  detected.cachePlugin = cachePlugin ? cachePlugin.name : null;

  return detected;
}

async function fetchSitemap(domain: string, proxyUsed: string | null): Promise<{ count: number; lastmods: string[] } | null> {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  const paths = ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap-index.xml"];
  for (const p of paths) {
    try {
      const url = new URL(p, base).toString();
      let text: string;
      if (proxyUsed) {
        const proxyRes = await fetch(`${proxyUsed}?url=${encodeURIComponent(url)}`, { cache: "no-store" });
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
    return {
      ttfb: metrics?.["server-response-time"]?.numericValue ? Math.round(metrics["server-response-time"].numericValue) : null,
      lcp: metrics?.["largest-contentful-paint"]?.numericValue ? Math.round(metrics["largest-contentful-paint"].numericValue) : null,
      cls: metrics?.["cumulative-layout-shift"]?.numericValue ? Math.round(metrics["cumulative-layout-shift"].numericValue * 100) / 100 : null,
    };
  } catch {
    return { ttfb: null, lcp: null, cls: null };
  }
}

async function analyzeViaWorker(workerUrl: string, domain: string): Promise<AnalysisResult | null> {
  try {
    const url = `${workerUrl.replace(/\/$/, "")}/analyze?url=${encodeURIComponent(domain)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json() as AnalysisResult;
  } catch {
    return null;
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
    cmsVersion: null,
    phpVersion: null,
    theme: null,
    themeVersion: null,
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
    plugins: [],
    serverSoftware: null,
  };

  const status: ScanStatus = {
    homepageFetched: false,
    sitemapFetched: false,
    pageSpeedFetched: false,
    dnsFetched: false,
    proxyUsed: null,
    pageSpeedRateLimited: false,
  };

  const apiKeys = getApiKeys();
  if (apiKeys.workerUrl) {
    const workerResult = await analyzeViaWorker(apiKeys.workerUrl, cleanDomain);
    if (workerResult) return workerResult;
  }

  const dns = await analyzeDns(cleanDomain);
  status.dnsFetched = dns.nameservers.length > 0 || dns.aRecords.length > 0;

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

  if (dns.cdnProvider === "Cloudflare" || dns.cdnProvider === "Akamai") {
    base.hasCloudflare = true;
  }

  const sitemap = await fetchSitemap(cleanDomain, status.proxyUsed);
  if (sitemap) {
    base.estimatedPages = sitemap.count;
    status.sitemapFetched = true;
  }

  const psi = await fetchPageSpeed(cleanDomain);
  base.ttfb = psi.ttfb;
  base.lcp = psi.lcp;
  base.cls = psi.cls;
  status.pageSpeedFetched = psi.ttfb !== null || psi.lcp !== null;

  return { tech: base, status, dns };
}
