import { DetectedTech, ScanStatus, DetectedPlugin } from "@/types";
import { DnsInfo, analyzeDns } from "./dns";
import { getApiKeys } from "./api-keys";

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

// ── Plugin mapping: slug → { name, category } ──
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
  "all-in-one-wp-security-and-firewall": { name: "All In One WP Security", category: "security" },
  "advanced-custom-fields": { name: "Advanced Custom Fields", category: "other" },
  acf: { name: "Advanced Custom Fields", category: "other" },
  "custom-post-type-ui": { name: "Custom Post Type UI", category: "other" },
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
  "sensei-lms": { name: "Sensei LMS", category: "lms" },
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
  "shortcodes-ultimate": { name: "Shortcodes Ultimate", category: "other" },
  tablepress: { name: "TablePress", category: "other" },
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

// ── Plugin signatures: HTML patterns that reveal plugins even when paths are hidden ──
const PLUGIN_SIGNATURES: Array<{ patterns: string[]; slug: string; name: string; category: DetectedPlugin["category"] }> = [
  { patterns: ["woocommerce", "wc-", "woocommerce_params", "wc_cart_fragments", "class=\"woocommerce"], slug: "woocommerce", name: "WooCommerce", category: "ecommerce" },
  { patterns: ["elementor", "data-elementor-type", "elementor-widget", "elementor-kit"], slug: "elementor", name: "Elementor", category: "page-builder" },
  { patterns: ["wpcf7", "class=\"wpcf7", "wpcf7-form"], slug: "contact-form-7", name: "Contact Form 7", category: "forms" },
  { patterns: ["gravityform", "gform_wrapper", "gform_fields"], slug: "gravityforms", name: "Gravity Forms", category: "forms" },
  { patterns: ["wpforms", "wpforms-form", "wpforms-container"], slug: "wpforms", name: "WPForms", category: "forms" },
  { patterns: ["ninja-forms", "nf-form", "ninja-forms-cont"], slug: "ninja-forms", name: "Ninja Forms", category: "forms" },
  { patterns: ["formidable", "frm_form_fields", "with_frm_style"], slug: "formidable", name: "Formidable Forms", category: "forms" },
  { patterns: ["fluentform", "fluentform_wrapper", "ff-default"], slug: "fluentform", name: "Fluent Forms", category: "forms" },
  { patterns: ["yoast-schema-graph", "yoast-seo", "yoast-schema"], slug: "wordpress-seo", name: "Yoast SEO", category: "seo" },
  { patterns: ["rank-math", "rank-math-schema"], slug: "rank-math", name: "Rank Math", category: "seo" },
  { patterns: ["wp-rocket", "rocket-lazyload", "wpr-placeholder", "rocket-minify"], slug: "wp-rocket", name: "WP Rocket", category: "cache" },
  { patterns: ["litespeed-cache", "litespeed-icon", "lscwp"], slug: "litespeed-cache", name: "LiteSpeed Cache", category: "cache" },
  { patterns: ["w3-total-cache", "w3tc-minify"], slug: "w3-total-cache", name: "W3 Total Cache", category: "cache" },
  { patterns: ["wp-super-cache"], slug: "wp-super-cache", name: "WP Super Cache", category: "cache" },
  { patterns: ["memberpress", "mepr-", "mepr-form"], slug: "memberpress", name: "MemberPress", category: "membership" },
  { patterns: ["learndash", "ld_course_list", "learndash-wrapper"], slug: "learndash", name: "LearnDash", category: "lms" },
  { patterns: ["lifterlms", "llms-"], slug: "lifterlms", name: "LifterLMS", category: "lms" },
  { patterns: ["tutorlms", "tutor-course", "tutor-wrap"], slug: "tutorlms", name: "Tutor LMS", category: "lms" },
  { patterns: ["buddyboss", "buddyboss-theme"], slug: "buddyboss", name: "BuddyBoss", category: "membership" },
  { patterns: ["buddypress", "bp-"], slug: "buddypress", name: "BuddyPress", category: "membership" },
  { patterns: ["bbpress", "bbp-"], slug: "bbpress", name: "bbPress", category: "membership" },
  { patterns: ["revslider", "rev_slider", "tp-caption"], slug: "revslider", name: "Slider Revolution", category: "page-builder" },
  { patterns: ["js_composer", "vc_row", "vc_column"], slug: "js_composer", name: "WPBakery Page Builder", category: "page-builder" },
  { patterns: ["advanced-custom-fields", "acf-"], slug: "advanced-custom-fields", name: "Advanced Custom Fields", category: "other" },
  { patterns: ["wordfence", "wordfence-sync"], slug: "wordfence", name: "Wordfence", category: "security" },
  { patterns: ["sucuri-scanner"], slug: "sucuri", name: "Sucuri", category: "security" },
  { patterns: ["updraftplus", "updraft-"], slug: "updraftplus", name: "UpdraftPlus", category: "backup" },
  { patterns: ["jetpack", "jp-"], slug: "jetpack", name: "Jetpack", category: "other" },
  { patterns: ["mailchimp-for-wp", "mc4wp-"], slug: "mailchimp-for-wp", name: "Mailchimp for WP", category: "other" },
  { patterns: ["wpml", "wpml-ls-"], slug: "wpml", name: "WPML", category: "other" },
  { patterns: ["polylang", "pll-"], slug: "polylang", name: "Polylang", category: "other" },
  { patterns: ["weglot"], slug: "weglot", name: "Weglot", category: "other" },
  { patterns: ["tablepress", "tablepress-id"], slug: "tablepress", name: "TablePress", category: "other" },
  { patterns: ["the-events-calendar", "tribe-events"], slug: "the-events-calendar", name: "The Events Calendar", category: "other" },
  { patterns: ["easy-digital-downloads", "edd-"], slug: "easy-digital-downloads", name: "Easy Digital Downloads", category: "ecommerce" },
  { patterns: ["restrict-content-pro", "rcp-"], slug: "restrict-content-pro", name: "Restrict Content Pro", category: "membership" },
  { patterns: ["pmpro", "pmpro-"], slug: "pmpro", name: "Paid Memberships Pro", category: "membership" },
  { patterns: ["redirection"], slug: "redirection", name: "Redirection", category: "seo" },
  { patterns: ["duplicate-post"], slug: "duplicate-post", name: "Duplicate Post", category: "other" },
  { patterns: ["wp-optimize"], slug: "wp-optimize", name: "WP-Optimize", category: "cache" },
  { patterns: ["google-analytics-for-wordpress", "monsterinsights"], slug: "google-analytics-for-wordpress", name: "MonsterInsights", category: "analytics" },
  { patterns: ["exactmetrics"], slug: "exactmetrics", name: "ExactMetrics", category: "analytics" },
  { patterns: ["shortcodes-ultimate", "su-"], slug: "shortcodes-ultimate", name: "Shortcodes Ultimate", category: "other" },
  { patterns: ["wp-migrate-db"], slug: "wp-migrate-db", name: "WP Migrate DB", category: "backup" },
  { patterns: ["backupbuddy"], slug: "backupbuddy", name: "BackupBuddy", category: "backup" },
  { patterns: ["all-in-one-wp-migration"], slug: "all-in-one-wp-migration", name: "All-in-One WP Migration", category: "backup" },
  { patterns: ["divi-builder", "et_pb_"], slug: "divi-builder", name: "Divi Builder", category: "page-builder" },
  { patterns: ["fusion-builder", "fusion-"], slug: "fusion-builder", name: "Fusion Builder", category: "page-builder" },
  { patterns: ["beaver-builder", "fl-builder"], slug: "beaver-builder", name: "Beaver Builder", category: "page-builder" },
  { patterns: ["woocommerce-subscriptions"], slug: "woocommerce-subscriptions", name: "WooCommerce Subscriptions", category: "ecommerce" },
  { patterns: ["woocommerce-memberships"], slug: "woocommerce-memberships", name: "WooCommerce Memberships", category: "membership" },
  { patterns: ["wp-super-cache"], slug: "wp-super-cache", name: "WP Super Cache", category: "cache" },
  { patterns: ["wp-fastest-cache"], slug: "wp-fastest-cache", name: "WP Fastest Cache", category: "cache" },
  { patterns: ["cache-enabler"], slug: "cache-enabler", name: "Cache Enabler", category: "cache" },
  { patterns: ["swift-performance"], slug: "swift-performance", name: "Swift Performance", category: "cache" },
  { patterns: ["eventon"], slug: "eventon", name: "EventON", category: "other" },
  { patterns: ["woocommerce-bookings"], slug: "woocommerce-bookings", name: "WooCommerce Bookings", category: "other" },
  { patterns: ["product-add-ons"], slug: "product-add-ons", name: "WooCommerce Product Add-Ons", category: "ecommerce" },
  { patterns: ["elementor-extras"], slug: "elementor-extras", name: "Elementor Extras", category: "page-builder" },
  { patterns: ["essential-addons-for-elementor-lite"], slug: "essential-addons-for-elementor-lite", name: "Essential Addons for Elementor", category: "page-builder" },
  { patterns: ["ultimate-elementor"], slug: "ultimate-elementor", name: "Ultimate Elementor", category: "page-builder" },
  { patterns: ["powerpack-elements"], slug: "powerpack-elements", name: "PowerPack Elements", category: "page-builder" },
  { patterns: ["happy-elementor-addons"], slug: "happy-elementor-addons", name: "Happy Elementor Addons", category: "page-builder" },
];

// ── Fetch helpers ──
async function fetchViaProxy(url: string): Promise<{ text: string; headers: Headers; proxy: string; statusCode: number } | null> {
  for (const proxyFn of CORS_PROXIES) {
    const proxyUrl = proxyFn(url);
    try {
      const res = await fetch(proxyUrl, { cache: "no-store" });
      if (!res.ok) continue;
      const text = await res.text();
      if (text.length < 100) continue;
      return { text, headers: res.headers, proxy: proxyUrl.split("?")[0], statusCode: res.status };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchDirect(url: string): Promise<{ text: string; headers: Headers; statusCode: number } | null> {
  try {
    const res = await fetch(url, { mode: "cors", cache: "no-store" });
    if (!res.ok) return null;
    return { text: await res.text(), headers: res.headers, statusCode: res.status };
  } catch {
    return null;
  }
}

async function fetchAny(url: string, proxyUsed: string | null): Promise<{ text: string; headers: Headers; statusCode: number; via: string } | null> {
  const direct = await fetchDirect(url);
  if (direct) return { ...direct, via: "direct" };
  if (proxyUsed) {
    try {
      const res = await fetch(`${proxyUsed}?url=${encodeURIComponent(url)}`, { cache: "no-store" });
      if (!res.ok) return null;
      const text = await res.text();
      if (text.length < 100) return null;
      return { text, headers: res.headers, statusCode: res.status, via: proxyUsed };
    } catch {
      return null;
    }
  }
  const proxy = await fetchViaProxy(url);
  if (proxy) return { ...proxy, via: proxy.proxy };
  return null;
}

// ── WordPress detection from RSS feed ──
function detectWpFromFeed(text: string): { isWp: boolean; version: string | null } {
  const lower = text.toLowerCase();
  if (!lower.includes("wordpress") && !lower.includes("rss") && !lower.includes("channel")) {
    return { isWp: false, version: null };
  }
  // RSS generator tag: <generator>https://wordpress.org/?v=6.4.3</generator>
  const genMatch = text.match(/<generator>https:\/\/wordpress\.org\/\?v=([0-9.]+)<\/generator>/i);
  if (genMatch) return { isWp: true, version: genMatch[1] };
  // Some feeds just say WordPress
  if (lower.includes("wordpress")) return { isWp: true, version: null };
  return { isWp: false, version: null };
}

// ── WordPress detection from REST API ──
function detectWpFromApi(text: string): { isWp: boolean; version: string | null } {
  try {
    const data = JSON.parse(text);
    if (data?.namespaces?.some((n: string) => n.includes("wp/") || n.includes("wc/"))) {
      return { isWp: true, version: null };
    }
    if (data?.authentication?.["application-passwords"]?.endpoints?.["authorization"]?.includes("wp-json")) {
      return { isWp: true, version: null };
    }
  } catch {
    // not JSON
  }
  return { isWp: false, version: null };
}

// ── WordPress detection from OPML ──
function detectWpFromOpml(text: string): { isWp: boolean; version: string | null } {
  const lower = text.toLowerCase();
  if (lower.includes("wordpress") && lower.includes("opml")) {
    return { isWp: true, version: null };
  }
  return { isWp: false, version: null };
}

// ── Multi-endpoint WordPress probe ──
async function probeWordPress(baseUrl: string, proxyUsed: string | null): Promise<{
  isWordPress: boolean;
  version: string | null;
  feedFetched: boolean;
  apiFetched: boolean;
  opmlFetched: boolean;
}> {
  let isWordPress = false;
  let version: string | null = null;
  let feedFetched = false;
  let apiFetched = false;
  let opmlFetched = false;

  // Try RSS feed
  const feed = await fetchAny(`${baseUrl}/feed/`, proxyUsed);
  if (feed) {
    feedFetched = true;
    const feedResult = detectWpFromFeed(feed.text);
    if (feedResult.isWp) {
      isWordPress = true;
      if (feedResult.version) version = feedResult.version;
    }
  }

  // Try REST API
  const api = await fetchAny(`${baseUrl}/wp-json/`, proxyUsed);
  if (api) {
    apiFetched = true;
    const apiResult = detectWpFromApi(api.text);
    if (apiResult.isWp) isWordPress = true;
  }

  // Try OPML
  const opml = await fetchAny(`${baseUrl}/wp-links-opml.php`, proxyUsed);
  if (opml) {
    opmlFetched = true;
    const opmlResult = detectWpFromOpml(opml.text);
    if (opmlResult.isWp) isWordPress = true;
  }

  return { isWordPress, version, feedFetched, apiFetched, opmlFetched };
}

// ── Theme detection ──
function detectTheme(html: string): string | null {
  const themeMatches = [...html.matchAll(/wp-content\/themes\/([^\/"'?\s]+)/gi)];
  const themes = [...new Set(themeMatches.map((m) => m[1]))];
  if (themes.length > 0) return themes[0];

  const bodyMatch = html.match(/<body[^>]+class=["']([^"']*theme-([^\s"']+))[^"']*["']/i);
  if (bodyMatch) return bodyMatch[2];

  const lower = html.toLowerCase();
  const knownThemes: [string, string][] = [
    ["astra", "Astra"],
    ["generatepress", "GeneratePress"],
    ["oceanwp", "OceanWP"],
    ["kadence-theme", "Kadence"],
    ["blocksy", "Blocksy"],
    ["neve", "Neve"],
    ["divi", "Divi"],
    ["avada", "Avada"],
    ["enfold", "Enfold"],
    ["betheme", "BeTheme"],
    ["x-theme", "X Theme"],
    ["salient", "Salient"],
    ["the7", "The7"],
    ["flatsome", "Flatsome"],
    ["woodmart", "WoodMart"],
    ["porto", "Porto"],
    ["uncode", "Uncode"],
    ["bridge", "Bridge"],
    ["newspaper", "Newspaper"],
    ["jnews", "JNews"],
    ["soledad", "Soledad"],
    ["genesis", "Genesis"],
    ["hello-elementor", "Hello Elementor"],
    ["storefront", "Storefront"],
    ["twentytwentyfour", "Twenty Twenty-Four"],
    ["twentytwentythree", "Twenty Twenty-Three"],
    ["twentytwentytwo", "Twenty Twenty-Two"],
    ["twentytwentyone", "Twenty Twenty-One"],
    ["twentytwenty", "Twenty Twenty"],
    ["twentynineteen", "Twenty Nineteen"],
  ];
  for (const [slug, name] of knownThemes) {
    if (lower.includes(slug)) return name;
  }

  return null;
}

// ── WordPress version from HTML ──
function detectWpVersionFromHtml(html: string): string | null {
  const meta = html.match(/<meta[^>]+name=["']generator["'][^>]+content=["']WordPress\s+([0-9.]+)/i);
  if (meta) return meta[1];
  const verMatch = html.match(/[?&]ver=([0-9.]+)/);
  if (verMatch) {
    const v = verMatch[1];
    if (v.startsWith("6.") || v.startsWith("5.") || v.startsWith("4.") || v.startsWith("3.")) return v;
  }
  const other = html.match(/WordPress\s+([0-9.]+)/i);
  if (other) return other[1];
  return null;
}

// ── Plugin detection ──
function detectPlugins(html: string): DetectedPlugin[] {
  const lower = html.toLowerCase();
  const found: DetectedPlugin[] = [];
  const foundSlugs = new Set<string>();

  // Signature-based detection
  for (const sig of PLUGIN_SIGNATURES) {
    const matched = sig.patterns.some((p) => lower.includes(p.toLowerCase()));
    if (matched && !foundSlugs.has(sig.slug)) {
      foundSlugs.add(sig.slug);
      found.push({ slug: sig.slug, name: sig.name, category: sig.category });
    }
  }

  // Path-based detection
  const matches = [...html.matchAll(/wp-content\/plugins\/([^\/"'?\s]+)/gi)];
  const slugs = [...new Set(matches.map((m) => m[1].toLowerCase()))];
  for (const slug of slugs) {
    if (foundSlugs.has(slug)) continue;
    foundSlugs.add(slug);
    const known = PLUGIN_MAP[slug];
    found.push({
      slug,
      name: known?.name || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      category: known?.category || "other",
    });
  }

  return found;
}

// ── CMS detection from HTML + headers ──
function detectCmsFromHtml(html: string, headers: Headers): string | null {
  const lower = html.toLowerCase();
  const h = (s: string) => lower.includes(s.toLowerCase());

  // WordPress
  if (h("wp-content")) return "WordPress";
  if (h("wp-includes")) return "WordPress";
  if (h("wp-json")) return "WordPress";
  if (h('generator" content="wordpress')) return "WordPress";
  if (h("/wp-admin")) return "WordPress";
  if (h("xmlrpc.php")) return "WordPress";
  if (h("wp-embed.min.js")) return "WordPress";
  if (h("wp-emoji-release.min.js")) return "WordPress";
  if (h("wp-block-library")) return "WordPress";
  if (/<body[^>]+class=["'][^"']*home blog/.test(html)) return "WordPress";
  if (/<body[^>]+class=["'][^"']*post-type/.test(html)) return "WordPress";
  if (/<body[^>]+class=["'][^"']*page-template/.test(html)) return "WordPress";
  if (h("rest_url")) return "WordPress";
  if (h("rest_nonce")) return "WordPress";
  if (h("wpApiSettings")) return "WordPress";

  const linkHeader = headers.get("link") || "";
  if (linkHeader.toLowerCase().includes("wp-json")) return "WordPress";
  if (headers.get("x-pingback")?.toLowerCase().includes("xmlrpc.php")) return "WordPress";

  // Others
  if (h("shopify") || h("myshopify") || h("cdn.shopify") || h("shopify.theme")) return "Shopify";
  if (h("webflow") || h("data-wf-domain") || h("w-nav")) return "Webflow";
  if (h("squarespace") || h("static.squarespace") || h("squarespace-cdn")) return "Squarespace";
  if (h("wix") || h("wix-image") || h("static.wixstatic")) return "Wix";
  if (h("drupal") || h("sites/default")) return "Drupal";
  if (h("joomla") || h("/media/jui") || h("/templates/")) return "Joomla";
  if (h("magento") || h("mage-") || h("amasty")) return "Magento";
  if (h("ghost") || h("@tryghost")) return "Ghost";
  if (h("next.js") || h("__next") || h("/_next/static")) return "Next.js";
  if (h("gatsby") || h("___gatsby")) return "Gatsby";
  if (h("astro")) return "Astro";
  if (h("nuxt") || h("__nuxt")) return "Nuxt";
  if (h("sveltekit") || h("__svelte")) return "SvelteKit";
  if (h("remix") || h("__remix")) return "Remix";

  return null;
}

function isPhpCms(cms: string | null): boolean {
  if (!cms) return false;
  const phpCmsList = ["WordPress", "Magento", "Drupal", "Joomla", "Laravel", "CakePHP", "Symfony", "PrestaShop", "OpenCart", "Zen Cart", "OSCommerce"];
  return phpCmsList.includes(cms);
}

// ── Scripts & analytics ──
function extractScripts(html: string): string[] {
  const scripts: string[] = [];
  const lower = html.toLowerCase();
  const check = (pattern: string, name: string) => {
    if (lower.includes(pattern.toLowerCase())) scripts.push(name);
  };
  check("googletagmanager", "Google Tag Manager");
  check("google-analytics", "Google Analytics");
  check("gtag", "Google Analytics (gtag)");
  check("facebook.com/tr", "Meta Pixel");
  check("hotjar", "Hotjar");
  check("clarity.ms", "Microsoft Clarity");
  check("segment.io", "Segment");
  check("mixpanel", "Mixpanel");
  check("intercom", "Intercom");
  check("hubspot", "HubSpot");
  check("zendesk", "Zendesk");
  check("tawk.to", "Tawk.to");
  check("stripe.com", "Stripe");
  check("paypal.com", "PayPal");
  check("googleads", "Google Ads");
  check("googlesyndication", "Google AdSense");
  check("outbrain", "Outbrain");
  check("taboola", "Taboola");
  check("algolia", "Algolia");
  check("swiper", "Swiper");
  check("gsap", "GSAP");
  check("lodash", "Lodash");
  check("axios", "Axios");
  check("three.js", "Three.js");
  check("d3.js", "D3.js");
  check("chart.js", "Chart.js");
  check("mapbox", "Mapbox");
  check("google.maps", "Google Maps");
  check("auth0", "Auth0");
  check("firebase", "Firebase");
  check("sentry", "Sentry");
  check("optimizely", "Optimizely");
  return [...new Set(scripts)];
}

function extractAnalytics(html: string): string[] {
  const lower = html.toLowerCase();
  const found: string[] = [];
  const checks: [string, string][] = [
    ["googletagmanager", "Google Tag Manager"],
    ["google-analytics", "Google Analytics"],
    ["gtag", "Google Analytics"],
    ["facebook.com/tr", "Meta Pixel"],
    ["hotjar", "Hotjar"],
    ["clarity.ms", "Microsoft Clarity"],
    ["segment.io", "Segment"],
    ["mixpanel", "Mixpanel"],
    ["amplitude", "Amplitude"],
    ["plausible.io", "Plausible"],
    ["posthog", "PostHog"],
    ["chartbeat", "Chartbeat"],
    ["parsely", "Parse.ly"],
    ["matomo", "Matomo"],
    ["piwik", "Matomo"],
    ["fathom", "Fathom"],
    ["umami", "Umami"],
  ];
  for (const [pattern, name] of checks) {
    if (lower.includes(pattern)) found.push(name);
  }
  return [...new Set(found)];
}

function extractMetaDescription(html: string): string | null {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
  if (match) return match[1].trim();
  const ogMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i);
  if (ogMatch) return ogMatch[1].trim();
  return null;
}

function extractInterestingHeaders(headers: Headers): Record<string, string> {
  const interesting = ["server", "x-powered-by", "cf-ray", "x-cache", "x-cdn", "via", "x-request-id", "content-security-policy", "link"];
  const result: Record<string, string> = {};
  for (const key of interesting) {
    const val = headers.get(key);
    if (val) result[key] = val;
  }
  return result;
}

function detectPhpVersion(headers: Headers): string | null {
  const powered = headers.get("x-powered-by") || "";
  const match = powered.match(/PHP\/([0-9.]+)/i);
  return match ? match[1] : null;
}

function detectServerSoftware(headers: Headers): string | null {
  return headers.get("server") || null;
}

// ── Sitemap ──
async function fetchSitemap(domain: string, proxyUsed: string | null): Promise<{ count: number; lastmods: string[] } | null> {
  const base = domain.startsWith("http") ? domain : `https://${domain}`;
  const paths = ["/sitemap.xml", "/sitemap_index.xml", "/wp-sitemap.xml", "/sitemap-index.xml"];
  for (const p of paths) {
    try {
      const url = new URL(p, base).toString();
      const fetched = await fetchAny(url, proxyUsed);
      if (!fetched) continue;
      const urlMatches = fetched.text.match(/<url>/g);
      const count = urlMatches ? urlMatches.length : 0;
      const lastmods = [...fetched.text.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map((m) => m[1]);
      return { count: Math.min(count, 10000), lastmods: lastmods.slice(0, 10) };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchPageSpeed(domain: string): Promise<{ ttfb: number | null; lcp: number | null; cls: number | null; rateLimited: boolean }> {
  try {
    const url = domain.startsWith("http") ? domain : `https://${domain}`;
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=PERFORMANCE&strategy=desktop`;
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
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
    return { ttfb: null, lcp: null, cls: null, rateLimited: false };
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
    cms: null, cmsVersion: null, phpVersion: null, theme: null, themeVersion: null,
    isWordPress: false, isPhpSite: false, hasWooCommerce: false, hasElementor: false,
    hasMemberPress: false, hasLearnDash: false, hasBuddyBoss: false, hasContactForm7: false,
    hasGravityForms: false, hasYoast: false, hasRankMath: false, hasWPRocket: false,
    hasW3TotalCache: false, hasLiteSpeedCache: false, hasCloudflare: false,
    cachePlugin: null, heavyPluginsCount: 0, estimatedPages: 0,
    ttfb: null, lcp: null, cls: null, frameworks: [], plugins: [],
    serverSoftware: null, scripts: [], analytics: [], metaDescription: null,
    responseHeaders: {}, statusCode: null,
  };

  const status: ScanStatus = {
    homepageFetched: false, sitemapFetched: false, pageSpeedFetched: false,
    dnsFetched: false, proxyUsed: null, pageSpeedRateLimited: false,
  };

  const apiKeys = getApiKeys();
  if (apiKeys.workerUrl) {
    const workerResult = await analyzeViaWorker(apiKeys.workerUrl, cleanDomain);
    if (workerResult) return workerResult;
  }

  const dns = await analyzeDns(cleanDomain);
  status.dnsFetched = dns.nameservers.length > 0 || dns.aRecords.length > 0;

  // Fetch homepage
  let html: string | null = null;
  let headers = new Headers();
  let statusCode = 0;

  const direct = await fetchDirect(baseUrl);
  if (direct) {
    html = direct.text;
    headers = direct.headers;
    statusCode = direct.statusCode;
    status.homepageFetched = true;
  } else {
    const proxy = await fetchViaProxy(baseUrl);
    if (proxy) {
      html = proxy.text;
      headers = proxy.headers;
      statusCode = proxy.statusCode;
      status.homepageFetched = true;
      status.proxyUsed = proxy.proxy;
    }
  }

  // Detect CMS from homepage
  let cmsFromHtml: string | null = null;
  if (html) {
    cmsFromHtml = detectCmsFromHtml(html, headers);
  }

  // Probe WordPress via RSS/API/OPML
  const wpProbe = await probeWordPress(baseUrl, status.proxyUsed);

  // Determine final CMS
  if (cmsFromHtml === "WordPress" || wpProbe.isWordPress) {
    base.cms = "WordPress";
    base.isWordPress = true;
    base.isPhpSite = true;
  } else {
    base.cms = cmsFromHtml;
    base.isPhpSite = isPhpCms(cmsFromHtml);
  }

  // Version: prefer feed version, then HTML
  if (wpProbe.version) {
    base.cmsVersion = wpProbe.version;
  } else if (html) {
    base.cmsVersion = detectWpVersionFromHtml(html);
  }

  // Detect plugins from homepage HTML
  if (html) {
    base.plugins = base.isWordPress ? detectPlugins(html) : [];
  }

  // Theme
  if (html && base.isWordPress) {
    base.theme = detectTheme(html);
  }

  // PHP version
  base.phpVersion = detectPhpVersion(headers);
  base.serverSoftware = detectServerSoftware(headers);

  // Scripts, analytics, meta, headers
  if (html) {
    base.scripts = extractScripts(html);
    base.analytics = extractAnalytics(html);
    base.metaDescription = extractMetaDescription(html);
  }
  base.responseHeaders = extractInterestingHeaders(headers);
  base.statusCode = statusCode;

  // Cloudflare from headers
  const cfHeader = headers.get("cf-ray") || headers.get("server") || "";
  if (cfHeader.toLowerCase().includes("cloudflare")) {
    base.hasCloudflare = true;
  }
  if (dns.cdnProvider === "Cloudflare" || dns.cdnProvider === "Akamai") {
    base.hasCloudflare = true;
  }

  // Plugin flags
  base.hasWooCommerce = base.plugins.some((p) => p.slug === "woocommerce" || p.slug === "woo-commerce");
  base.hasElementor = base.plugins.some((p) => p.slug === "elementor" || p.slug === "elementor-pro");
  base.hasMemberPress = base.plugins.some((p) => p.slug === "memberpress");
  base.hasLearnDash = base.plugins.some((p) => p.slug === "learndash" || p.slug === "sfwd-lms");
  base.hasBuddyBoss = base.plugins.some((p) => p.slug === "buddyboss" || p.slug === "buddypress");
  base.hasContactForm7 = base.plugins.some((p) => p.slug === "contact-form-7" || p.slug === "wpcf7");
  base.hasGravityForms = base.plugins.some((p) => p.slug === "gravityforms" || p.slug === "gravity-forms");
  base.hasYoast = base.plugins.some((p) => p.slug === "wordpress-seo" || p.slug === "yoast-seo");
  base.hasRankMath = base.plugins.some((p) => p.slug === "rank-math");
  base.hasWPRocket = base.plugins.some((p) => p.slug === "wp-rocket");
  base.hasW3TotalCache = base.plugins.some((p) => p.slug === "w3-total-cache");
  base.hasLiteSpeedCache = base.plugins.some((p) => p.slug === "litespeed-cache");

  const heavyCats = ["ecommerce", "page-builder", "membership", "lms", "forms"];
  base.heavyPluginsCount = base.plugins.filter((p) => heavyCats.includes(p.category)).length;

  const cacheSlugs = ["wp-rocket", "w3-total-cache", "litespeed-cache", "wp-super-cache", "wp-fastest-cache", "cache-enabler", "swift-performance"];
  const cachePlugin = base.plugins.find((p) => cacheSlugs.includes(p.slug));
  base.cachePlugin = cachePlugin ? cachePlugin.name : null;

  // Sitemap
  const sitemap = await fetchSitemap(cleanDomain, status.proxyUsed);
  if (sitemap) {
    base.estimatedPages = sitemap.count;
    status.sitemapFetched = true;
  }

  // PageSpeed
  const psi = await fetchPageSpeed(cleanDomain);
  base.ttfb = psi.ttfb;
  base.lcp = psi.lcp;
  base.cls = psi.cls;
  status.pageSpeedFetched = psi.ttfb !== null || psi.lcp !== null;
  status.pageSpeedRateLimited = psi.rateLimited;

  return { tech: base, status, dns };
}
