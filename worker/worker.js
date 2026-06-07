/**
 * PHP Worker Calculator — Detection Proxy
 * A Cloudflare Worker that fetches websites server-side and runs full tech detection.
 * No CORS issues. Deploys in 60 seconds.
 */

// ── Known plugin mapping: slug → { name, category } ──
const PLUGIN_MAP = {
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
  "wpcf7": { name: "Contact Form 7", category: "forms" },
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
  "all-in-one-wp-security-and-firewall": { name: "All In One WP Security", category: "security" },
  "advanced-custom-fields": { name: "Advanced Custom Fields", category: "other" },
  acf: { name: "Advanced Custom Fields", category: "other" },
  "custom-post-type-ui": { name: "Custom Post Type UI", category: "other" },
  "slider-revolution": { name: "Slider Revolution", category: "page-builder" },
  revslider: { name: "Slider Revolution", category: "page-builder" },
  "js_composer": { name: "WPBakery Page Builder", category: "page-builder" },
  "wpbakery": { name: "WPBakery Page Builder", category: "page-builder" },
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
  "sensei-lms": { name: "Sensei LMS", category: "lms" },
  bbpress: { name: "bbPress", category: "membership" },
  "wpforms": { name: "WPForms", category: "forms" },
  "ninja-forms": { name: "Ninja Forms", category: "forms" },
  "formidable": { name: "Formidable Forms", category: "forms" },
  "mailchimp-for-wp": { name: "Mailchimp for WP", category: "other" },
  "fluentform": { name: "Fluent Forms", category: "forms" },
  "weglot": { name: "Weglot", category: "other" },
  "polylang": { name: "Polylang", category: "other" },
  "wpml": { name: "WPML", category: "other" },
  "google-analytics-for-wordpress": { name: "MonsterInsights", category: "analytics" },
  "exactmetrics": { name: "ExactMetrics", category: "analytics" },
  "redirection": { name: "Redirection", category: "seo" },
  "duplicate-post": { name: "Duplicate Post", category: "other" },
  "updraftplus": { name: "UpdraftPlus", category: "backup" },
  "backupbuddy": { name: "BackupBuddy", category: "backup" },
  "all-in-one-wp-migration": { name: "All-in-One WP Migration", category: "backup" },
  "wp-optimize": { name: "WP-Optimize", category: "cache" },
  "shortcodes-ultimate": { name: "Shortcodes Ultimate", category: "other" },
  "tablepress": { name: "TablePress", category: "other" },
  "wp-migrate-db": { name: "WP Migrate DB", category: "backup" },
  "query-monitor": { name: "Query Monitor", category: "other" },
  "debug-bar": { name: "Debug Bar", category: "other" },
  "woocommerce-subscriptions": { name: "WooCommerce Subscriptions", category: "ecommerce" },
  "woocommerce-memberships": { name: "WooCommerce Memberships", category: "membership" },
  "woocommerce-bookings": { name: "WooCommerce Bookings", category: "other" },
  "product-add-ons": { name: "WooCommerce Product Add-Ons", category: "ecommerce" },
  "elementor-extras": { name: "Elementor Extras", category: "page-builder" },
  "essential-addons-for-elementor-lite": { name: "Essential Addons for Elementor", category: "page-builder" },
  "ultimate-elementor": { name: "Ultimate Elementor", category: "page-builder" },
  "powerpack-elements": { name: "PowerPack Elements", category: "page-builder" },
  "happy-elementor-addons": { name: "Happy Elementor Addons", category: "page-builder" },
};

const HOSTING_PATTERNS = {
  awsdns: "Amazon Web Services",
  cloudflare: "Cloudflare",
  googledomains: "Google Domains",
  domaincontrol: "GoDaddy",
  worldnic: "Network Solutions",
  "registrar-servers": "Namecheap",
  digitalocean: "DigitalOcean",
  linode: "Linode",
  hetzner: "Hetzner",
  ovh: "OVHcloud",
  "azure-dns": "Microsoft Azure",
  dnsmadeeasy: "DNS Made Easy",
  nsone: "NS1",
  dyn: "Dyn DNS",
  ultradns: "UltraDNS",
  akam: "Akamai",
};

const CDN_PATTERNS = {
  cloudflare: "Cloudflare",
  cloudfront: "AWS CloudFront",
  akamai: "Akamai",
  akam: "Akamai",
  edgekey: "Akamai",
  edgesuite: "Akamai",
  fastly: "Fastly",
  googlehosted: "Google Cloud CDN",
  googleusercontent: "Google",
  "b-cdn": "BunnyCDN",
  stackpath: "StackPath",
  keycdn: "KeyCDN",
  cdn77: "CDN77",
  incapdns: "Imperva",
  sucuri: "Sucuri",
};

const EMAIL_PATTERNS = {
  google: "Google Workspace",
  outlook: "Microsoft 365",
  microsoft: "Microsoft 365",
  zoho: "Zoho Mail",
  protonmail: "ProtonMail",
  mimecast: "Mimecast",
  proofpoint: "Proofpoint",
  mailgun: "Mailgun",
  sendgrid: "SendGrid",
  amazonses: "Amazon SES",
  postmark: "Postmark",
  pphosted: "Proofpoint",
};

function findProvider(texts, patterns) {
  const joined = texts.join(" ").toLowerCase();
  for (const [pattern, provider] of Object.entries(patterns)) {
    if (joined.includes(pattern.toLowerCase())) return provider;
  }
  return null;
}

async function queryDns(name, type) {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
      { headers: { Accept: "application/dns-json" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.Answer || [];
  } catch {
    return [];
  }
}

async function analyzeDns(domain) {
  const wwwDomain = domain.startsWith("www.") ? domain : `www.${domain}`;
  const [ns, a, cname, mx] = await Promise.all([
    queryDns(domain, "NS"),
    queryDns(domain, "A"),
    queryDns(wwwDomain, "CNAME"),
    queryDns(domain, "MX"),
  ]);

  return {
    nameservers: ns.map((r) => r.data),
    aRecords: a.map((r) => r.data),
    cnameRecords: cname.map((r) => r.data),
    mxRecords: mx.map((r) => r.data),
    txtRecords: [],
    hostingProvider: findProvider(ns.map((r) => r.data), HOSTING_PATTERNS),
    cdnProvider: findProvider(
      [...cname.map((r) => r.data), ...ns.map((r) => r.data)],
      CDN_PATTERNS
    ),
    emailProvider: findProvider(mx.map((r) => r.data), EMAIL_PATTERNS),
  };
}

function extractPlugins(html) {
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

function extractThemes(html) {
  const matches = [...html.matchAll(/wp-content\/themes\/([^\/"'?\s]+)/gi)];
  return [...new Set(matches.map((m) => m[1]))];
}

function detectWordPressVersion(html) {
  const meta = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress\s+([0-9.]+)/i);
  if (meta) return meta[1];
  const other = html.match(/WordPress\s+([0-9.]+)/i);
  if (other) return other[1];
  return null;
}

function detectPhpVersion(headers) {
  const powered = headers.get("x-powered-by") || "";
  const match = powered.match(/PHP\/([0-9.]+)/i);
  return match ? match[1] : null;
}

function detectServerSoftware(headers) {
  return headers.get("server") || null;
}

function detectCmsAndPlugins(html, headers) {
  const lower = html.toLowerCase();
  const has = (str) => lower.includes(str.toLowerCase());
  const frameworks = [];
  let cms = null;

  // CMS detection
  if (has("wp-content") || has("wp-includes") || has("wp-json") || has('generator" content="wordpress') || has("/wp-admin")) {
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

  const isWp = cms === "WordPress";
  const plugins = isWp ? extractPlugins(html) : [];
  const themes = isWp ? extractThemes(html) : [];
  const wpVersion = isWp ? detectWordPressVersion(html) : null;
  const phpVersion = detectPhpVersion(headers);
  const serverSoftware = detectServerSoftware(headers);
  const theme = themes.length > 0 ? themes[0] : null;

  // Known plugin flags
  const detected = {
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
    cms,
    cmsVersion: wpVersion,
    phpVersion,
    theme,
    themeVersion: null,
    plugins,
    serverSoftware,
    frameworks,
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

async function fetchSitemap(baseUrl) {
  const paths = ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap-index.xml"];
  for (const p of paths) {
    try {
      const res = await fetch(new URL(p, baseUrl).toString());
      if (!res.ok) continue;
      const text = await res.text();
      const urlMatches = text.match(/<url>/g);
      return { count: Math.min(urlMatches ? urlMatches.length : 0, 10000) };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchPageSpeed(url) {
  for (const strategy of ["desktop", "mobile"]) {
    try {
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&strategy=${strategy}`;
      const res = await fetch(apiUrl);
      if (!res.ok) {
        if (res.status === 429) continue;
        return { ttfb: null, lcp: null, cls: null, rateLimited: res.status === 429 };
      }
      const data = await res.json();
      const metrics = data?.lighthouseResult?.audits;
      return {
        ttfb: metrics?.["server-response-time"]?.numericValue ? Math.round(metrics["server-response-time"].numericValue) : null,
        lcp: metrics?.["largest-contentful-paint"]?.numericValue ? Math.round(metrics["largest-contentful-paint"].numericValue) : null,
        cls: metrics?.["cumulative-layout-shift"]?.numericValue ? Math.round(metrics["cumulative-layout-shift"].numericValue * 100) / 100 : null,
        rateLimited: false,
      };
    } catch {
      continue;
    }
  }
  return { ttfb: null, lcp: null, cls: null, rateLimited: true };
}

async function analyzeSite(domain, workerUrl) {
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  const base = {
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

  const status = {
    homepageFetched: false,
    sitemapFetched: false,
    pageSpeedFetched: false,
    dnsFetched: false,
    proxyUsed: workerUrl,
    pageSpeedRateLimited: false,
  };

  // Fetch homepage
  let html = null;
  let headers = new Headers();
  try {
    const res = await fetch(baseUrl, { redirect: "follow" });
    if (res.ok) {
      html = await res.text();
      headers = res.headers;
      status.homepageFetched = true;
    }
  } catch {
    // ignore
  }

  if (html) {
    const detected = detectCmsAndPlugins(html, headers);
    Object.assign(base, detected);
  }

  // DNS
  const dns = await analyzeDns(cleanDomain);
  status.dnsFetched = dns.nameservers.length > 0;
  if (dns.cdnProvider === "Cloudflare" || dns.cdnProvider === "Akamai") {
    base.hasCloudflare = true;
  }

  // Sitemap
  const sitemap = await fetchSitemap(baseUrl);
  if (sitemap) {
    base.estimatedPages = sitemap.count;
    status.sitemapFetched = true;
  }

  // PageSpeed
  const psi = await fetchPageSpeed(baseUrl);
  base.ttfb = psi.ttfb;
  base.lcp = psi.lcp;
  base.cls = psi.cls;
  status.pageSpeedFetched = psi.ttfb !== null || psi.lcp !== null;
  status.pageSpeedRateLimited = psi.rateLimited || false;

  return { tech: base, status, dns };
}

// ── CORS Helpers ──
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json",
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

// ── Worker Entry ──
export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === "/") {
      return jsonResponse({
        name: "PHP Worker Calculator — Detection Proxy",
        status: "ok",
        endpoints: { analyze: "/analyze?url=example.com" },
      });
    }

    if (url.pathname === "/analyze") {
      const target = url.searchParams.get("url");
      if (!target) {
        return jsonResponse({ error: "Missing 'url' query parameter" }, 400);
      }

      let cleanTarget = target.trim();
      if (!/^https?:\/\//.test(cleanTarget)) {
        cleanTarget = `https://${cleanTarget}`;
      }
      try {
        new URL(cleanTarget);
      } catch {
        return jsonResponse({ error: "Invalid URL format" }, 400);
      }

      const result = await analyzeSite(cleanTarget, url.origin);
      return jsonResponse(result);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
