/**
 * PHP Worker Calculator — Detection Proxy
 * A Cloudflare Worker that fetches websites server-side and runs tech detection.
 * No CORS issues. Deploys in 60 seconds.
 *
 * Deployment:
 * 1. Go to https://dash.cloudflare.com/ → Workers & Pages → Create
 * 2. Choose "Create Worker" → "Deploy"
 * 3. Click "Edit Code" and paste this entire file
 * 4. Click "Deploy"
 * 5. Copy your worker URL (e.g. https://php-worker-proxy.your-name.workers.dev)
 * 6. Paste it into the calculator's API settings
 */

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

const HOSTING_PATTERNS = {
  "awsdns": "Amazon Web Services",
  "cloudflare": "Cloudflare",
  "googledomains": "Google Domains",
  "domaincontrol": "GoDaddy",
  "worldnic": "Network Solutions",
  "registrar-servers": "Namecheap",
  "digitalocean": "DigitalOcean",
  "linode": "Linode",
  "hetzner": "Hetzner",
  "ovh": "OVHcloud",
  "azure-dns": "Microsoft Azure",
  "dnsmadeeasy": "DNS Made Easy",
  "nsone": "NS1",
  "dyn": "Dyn DNS",
  "ultradns": "UltraDNS",
};

const CDN_PATTERNS = {
  "cloudflare": "Cloudflare",
  "cloudfront": "AWS CloudFront",
  "akamai": "Akamai",
  "edgekey": "Akamai",
  "edgesuite": "Akamai",
  "fastly": "Fastly",
  "googlehosted": "Google Cloud CDN",
  "googleusercontent": "Google",
  "b-cdn": "BunnyCDN",
  "stackpath": "StackPath",
  "keycdn": "KeyCDN",
  "cdn77": "CDN77",
  "incapdns": "Imperva",
  "sucuri": "Sucuri",
};

const EMAIL_PATTERNS = {
  "google": "Google Workspace",
  "outlook": "Microsoft 365",
  "microsoft": "Microsoft 365",
  "zoho": "Zoho Mail",
  "protonmail": "ProtonMail",
  "mimecast": "Mimecast",
  "proofpoint": "Proofpoint",
  "mailgun": "Mailgun",
  "sendgrid": "SendGrid",
  "amazonses": "Amazon SES",
  "postmark": "Postmark",
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
    return (data.Answer || []).filter((a) => a.type !== 5);
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

  const nameservers = ns.map((r) => r.data);
  const cnameRecords = cname.map((r) => r.data);
  const mxRecords = mx.map((r) => r.data);

  return {
    nameservers,
    aRecords: a.map((r) => r.data),
    cnameRecords,
    mxRecords,
    txtRecords: [],
    hostingProvider: findProvider(nameservers, HOSTING_PATTERNS),
    cdnProvider: findProvider([...cnameRecords, ...nameservers], CDN_PATTERNS),
    emailProvider: findProvider(mxRecords, EMAIL_PATTERNS),
  };
}

function detectCmsAndPlugins(html, headers) {
  const lower = html.toLowerCase();
  const has = (str) => lower.includes(str.toLowerCase());
  const frameworks = [];
  let cms = null;

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

  // Plugins
  const detected = {
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

  let cachePlugin = null;
  for (const cp of CACHE_PLUGINS) {
    if (has(cp)) { cachePlugin = cp; break; }
  }
  detected.cachePlugin = cachePlugin;

  return { ...detected, cms, frameworks };
}

async function fetchSitemap(baseUrl) {
  const paths = ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap-index.xml"];
  for (const p of paths) {
    try {
      const res = await fetch(new URL(p, baseUrl).toString());
      if (!res.ok) continue;
      const text = await res.text();
      const urlMatches = text.match(/<url>/g);
      const count = urlMatches ? urlMatches.length : 0;
      return { count: Math.min(count, 10000) };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchPageSpeed(url) {
  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&strategy=desktop`;
    const res = await fetch(apiUrl);
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

async function analyzeSite(domain) {
  const baseUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");

  const base = {
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

  const status = {
    homepageFetched: false,
    sitemapFetched: false,
    pageSpeedFetched: false,
    dnsFetched: false,
    proxyUsed: "Cloudflare Worker (server-side)",
  };

  // Fetch homepage (server-side = no CORS issues)
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
  return new Response(JSON.stringify(data), {
    status,
    headers: CORS_HEADERS,
  });
}

// ── Worker Entry ──
export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/") {
      return jsonResponse({
        name: "PHP Worker Calculator — Detection Proxy",
        status: "ok",
        endpoints: {
          analyze: "/analyze?url=example.com",
        },
      });
    }

    // Analyze endpoint
    if (url.pathname === "/analyze") {
      const target = url.searchParams.get("url");
      if (!target) {
        return jsonResponse({ error: "Missing 'url' query parameter" }, 400);
      }

      // Validate URL format
      let cleanTarget = target.trim();
      if (!/^https?:\/\//.test(cleanTarget)) {
        cleanTarget = `https://${cleanTarget}`;
      }
      try {
        new URL(cleanTarget);
      } catch {
        return jsonResponse({ error: "Invalid URL format" }, 400);
      }

      const result = await analyzeSite(cleanTarget);
      return jsonResponse(result);
    }

    return jsonResponse({ error: "Not found" }, 404);
  },
};
