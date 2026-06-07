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

// ── Plugin HTML signatures ──
const PLUGIN_SIGNATURES = [
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

function isWordPress(html, headers) {
  const lower = html.toLowerCase();
  const h = (s) => lower.includes(s.toLowerCase());

  if (h("wp-content")) return true;
  if (h("wp-includes")) return true;
  if (h("wp-json")) return true;
  if (h('generator" content="wordpress')) return true;
  if (h("/wp-admin")) return true;
  if (h("xmlrpc.php")) return true;
  if (h("wp-embed.min.js")) return true;
  if (h("wp-emoji-release.min.js")) return true;
  if (h("wp-block-library")) return true;

  const linkHeader = headers.get("link") || "";
  if (linkHeader.toLowerCase().includes("wp-json")) return true;
  if (headers.get("x-pingback")?.toLowerCase().includes("xmlrpc.php")) return true;

  if (/<body[^>]+class=["'][^"']*home blog/.test(html)) return true;
  if (/<body[^>]+class=["'][^"']*post-type/.test(html)) return true;
  if (/<body[^>]+class=["'][^"']*page-template/.test(html)) return true;

  if (h("rest_url")) return true;
  if (h("rest_nonce")) return true;
  if (h("wpApiSettings")) return true;

  return false;
}

function detectCms(html, headers) {
  const lower = html.toLowerCase();
  const h = (s) => lower.includes(s.toLowerCase());

  if (isWordPress(html, headers)) return "WordPress";

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

function isPhpCms(cms) {
  if (!cms) return false;
  const phpCmsList = ["WordPress", "Magento", "Drupal", "Joomla", "Laravel", "CakePHP", "Symfony", "PrestaShop", "OpenCart", "Zen Cart", "OSCommerce"];
  return phpCmsList.includes(cms);
}

function detectTheme(html) {
  const themeMatches = [...html.matchAll(/wp-content\/themes\/([^\/"'?\s]+)/gi)];
  const themes = [...new Set(themeMatches.map((m) => m[1]))];
  if (themes.length > 0) return themes[0];

  const bodyMatch = html.match(/<body[^>]+class=["']([^"']*theme-([^\s"']+))[^"']*["']/i);
  if (bodyMatch) return bodyMatch[2];

  const lower = html.toLowerCase();
  const knownThemes = [
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

function detectWordPressVersion(html) {
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

function detectPluginsBySignatures(html) {
  const lower = html.toLowerCase();
  const found = [];
  const foundSlugs = new Set();

  for (const sig of PLUGIN_SIGNATURES) {
    const matched = sig.patterns.some((p) => lower.includes(p.toLowerCase()));
    if (matched && !foundSlugs.has(sig.slug)) {
      foundSlugs.add(sig.slug);
      found.push({ slug: sig.slug, name: sig.name, category: sig.category });
    }
  }

  return found;
}

function extractPluginsFromPaths(html) {
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

function detectPhpVersion(headers) {
  const powered = headers.get("x-powered-by") || "";
  const match = powered.match(/PHP\/([0-9.]+)/i);
  return match ? match[1] : null;
}

function detectServerSoftware(headers) {
  return headers.get("server") || null;
}

function extractScripts(html) {
  const scripts = [];
  const lower = html.toLowerCase();
  const check = (pattern, name) => {
    if (lower.includes(pattern.toLowerCase())) scripts.push(name);
  };
  check("googletagmanager", "Google Tag Manager");
  check("google-analytics", "Google Analytics");
  check("gtag", "Google Analytics (gtag)");
  check("analytics.js", "Google Analytics");
  check("facebook.com/tr", "Meta Pixel");
  check("fbevents.js", "Meta Pixel");
  check("connect.facebook.net", "Facebook SDK");
  check("hotjar", "Hotjar");
  check("clarity.ms", "Microsoft Clarity");
  check("segment.io", "Segment");
  check("mixpanel", "Mixpanel");
  check("amplitude", "Amplitude");
  check("intercom", "Intercom");
  check("driftt", "Drift");
  check("hubspot", "HubSpot");
  check("hs-scripts", "HubSpot");
  check("zendesk", "Zendesk");
  check("freshchat", "Freshchat");
  check("tawk.to", "Tawk.to");
  check("crisp.chat", "Crisp");
  check("olark", "Olark");
  check("livechat", "LiveChat");
  check("stripe.com", "Stripe");
  check("paypal.com", "PayPal");
  check("braintree", "Braintree");
  check("googleads", "Google Ads");
  check("googlesyndication", "Google AdSense");
  check("doubleclick", "DoubleClick");
  check("adsystem", "Amazon Ads");
  check("outbrain", "Outbrain");
  check("taboola", "Taboola");
  check("twitter.com/widgets", "Twitter Embed");
  check("platform.twitter", "Twitter Embed");
  check("platform.x.com", "X Embed");
  check("instagram.com/embed", "Instagram Embed");
  check("youtube.com/embed", "YouTube Embed");
  check("vimeo.com", "Vimeo");
  check("tiktok.com", "TikTok");
  check("snap.licdn.com", "LinkedIn");
  check("redditstatic", "Reddit");
  check("pinterest", "Pinterest");
  check("algolia", "Algolia");
  check("typesense", "Typesense");
  check("meilisearch", "Meilisearch");
  check("swiper", "Swiper");
  check("slick-slider", "Slick");
  check("owl.carousel", "Owl Carousel");
  check("lazysizes", "Lazysizes");
  check("lozad", "Lozad");
  check("gsap", "GSAP");
  check("lodash", "Lodash");
  check("underscore", "Underscore");
  check("moment.js", "Moment.js");
  check("dayjs", "Day.js");
  check("date-fns", "date-fns");
  check("axios", "Axios");
  check("fetch/", "Fetch API");
  check("chart.js", "Chart.js");
  check("d3.js", "D3.js");
  check("three.js", "Three.js");
  check("webgl", "WebGL");
  check("prism.js", "Prism.js");
  check("highlight.js", "Highlight.js");
  check("tinymce", "TinyMCE");
  check("ckeditor", "CKEditor");
  check("monaco-editor", "Monaco Editor");
  check("codemirror", "CodeMirror");
  check("mapbox", "Mapbox");
  check("google.maps", "Google Maps");
  check("leaflet", "Leaflet");
  check("auth0", "Auth0");
  check("firebase", "Firebase");
  check("supabase", "Supabase");
  check("appwrite", "Appwrite");
  check("sentry", "Sentry");
  check("bugsnag", "Bugsnag");
  check("logrocket", "LogRocket");
  check("newrelic", "New Relic");
  check("datadog", "Datadog");
  check("fullstory", "FullStory");
  check("heap", "Heap");
  check("crazyegg", "Crazy Egg");
  check("optimizely", "Optimizely");
  check("vwo", "VWO");
  check("abtasty", "AB Tasty");
  check("launchdarkly", "LaunchDarkly");
  check("split.io", "Split");
  check("unpkg.com", "unpkg CDN");
  check("cdn.jsdelivr.net", "jsDelivr CDN");
  check("cdnjs.cloudflare.com", "cdnjs");
  check("polyfill.io", "Polyfill.io");
  return [...new Set(scripts)];
}

function extractAnalytics(html) {
  const lower = html.toLowerCase();
  const found = [];
  const checks = [
    ["googletagmanager", "Google Tag Manager"],
    ["google-analytics", "Google Analytics"],
    ["gtag", "Google Analytics"],
    ["analytics.js", "Google Analytics"],
    ["facebook.com/tr", "Meta Pixel"],
    ["fbevents.js", "Meta Pixel"],
    ["hotjar", "Hotjar"],
    ["clarity.ms", "Microsoft Clarity"],
    ["segment.io", "Segment"],
    ["mixpanel", "Mixpanel"],
    ["amplitude", "Amplitude"],
    ["heap.io", "Heap"],
    ["fullstory.com", "FullStory"],
    ["crazyegg", "Crazy Egg"],
    ["optimizely", "Optimizely"],
    ["vwo.com", "VWO"],
    ["adobe.com/analytics", "Adobe Analytics"],
    ["omniture", "Adobe Analytics"],
    ["piwik", "Matomo"],
    ["matomo", "Matomo"],
    ["plausible.io", "Plausible"],
    ["fathom", "Fathom"],
    ["simpleanalytics", "Simple Analytics"],
    ["umami", "Umami"],
    ["posthog", "PostHog"],
    ["chartbeat", "Chartbeat"],
    ["parsely", "Parse.ly"],
    ["comscore", "Comscore"],
    ["quantserve", "Quantcast"],
    ["statcounter", "StatCounter"],
    ["clicky", "Clicky"],
    ["gosquared", "GoSquared"],
    ["woopra", "Woopra"],
    ["kissmetrics", "Kissmetrics"],
  ];
  for (const [pattern, name] of checks) {
    if (lower.includes(pattern)) found.push(name);
  }
  return [...new Set(found)];
}

function extractMetaDescription(html) {
  const match = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);
  if (match) return match[1].trim();
  const ogMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i);
  if (ogMatch) return ogMatch[1].trim();
  return null;
}

function extractInterestingHeaders(headers) {
  const interesting = ["server", "x-powered-by", "cf-ray", "x-cache", "x-cdn", "via", "x-request-id", "content-security-policy", "link"];
  const result = {};
  for (const key of interesting) {
    const val = headers.get(key);
    if (val) result[key] = val;
  }
  return result;
}

function detectCmsAndPlugins(html, headers, statusCode) {
  const lower = html.toLowerCase();
  const has = (str) => lower.includes(str.toLowerCase());
  const frameworks = [];

  const cms = detectCms(html, headers);
  const isWp = cms === "WordPress";

  // Plugins: combine path-based + signature-based
  const pluginsFromPaths = isWp ? extractPluginsFromPaths(html) : [];
  const pluginsFromSignatures = isWp ? detectPluginsBySignatures(html) : [];

  const pluginMap = new Map();
  for (const p of pluginsFromSignatures) pluginMap.set(p.slug, p);
  for (const p of pluginsFromPaths) {
    if (!pluginMap.has(p.slug)) pluginMap.set(p.slug, p);
  }
  const plugins = Array.from(pluginMap.values());

  const wpVersion = isWp ? detectWordPressVersion(html) : null;
  const phpVersion = detectPhpVersion(headers);
  const serverSoftware = detectServerSoftware(headers);
  const theme = isWp ? detectTheme(html) : null;
  const scripts = extractScripts(html);
  const analytics = extractAnalytics(html);
  const metaDescription = extractMetaDescription(html);
  const responseHeaders = extractInterestingHeaders(headers);

  // Frameworks
  if (has("react") || has("data-reactroot") || has("__react") || has("reactroot")) frameworks.push("React");
  if (has("next.js") || has("__next") || has("/_next/static")) frameworks.push("Next.js");
  if (has("vue.js") || has("__vue") || has("data-v-")) frameworks.push("Vue");
  if (has("nuxt") || has("__nuxt")) frameworks.push("Nuxt");
  if (has("angular") || has("ng-app") || has("ng-version")) frameworks.push("Angular");
  if (has("svelte") || has("svelte-")) frameworks.push("Svelte");
  if (has("remix") || has("__remix")) frameworks.push("Remix");
  if (has("jquery") || has("jquery.js")) frameworks.push("jQuery");
  if (has("tailwindcss") || has("tailwind")) frameworks.push("Tailwind CSS");
  if (has("bootstrap") || has("bootstrap.min.css")) frameworks.push("Bootstrap");
  if (has("styled-components") || has("data-styled")) frameworks.push("Styled Components");
  if (has("emotion") || has("data-emotion")) frameworks.push("Emotion");
  if (has("material-ui") || has("mui")) frameworks.push("Material UI");
  if (has("chakra-ui") || has("chakra")) frameworks.push("Chakra UI");
  if (has("ant.design") || has("antd")) frameworks.push("Ant Design");
  if (has("lodash") || has("lodash.min.js")) frameworks.push("Lodash");
  if (has("axios")) frameworks.push("Axios");
  if (has("gsap") || has("greensock")) frameworks.push("GSAP");
  if (has("webgl") || has("three.js") || has("three.min.js")) frameworks.push("Three.js / WebGL");
  if (has("d3.js") || has("d3.min.js")) frameworks.push("D3.js");
  if (has("chart.js")) frameworks.push("Chart.js");
  if (has("swiper")) frameworks.push("Swiper");

  const detected = {
    isWordPress: isWp,
    isPhpSite: isPhpCms(cms),
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
    scripts,
    analytics,
    metaDescription,
    responseHeaders,
    statusCode,
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
    isPhpSite: false,
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
    scripts: [],
    analytics: [],
    metaDescription: null,
    responseHeaders: {},
    statusCode: null,
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
  let statusCode = null;
  try {
    const res = await fetch(baseUrl, { redirect: "follow" });
    if (res.ok) {
      html = await res.text();
      headers = res.headers;
      statusCode = res.status;
      status.homepageFetched = true;
    }
  } catch {
    // ignore
  }

  if (html) {
    const detected = detectCmsAndPlugins(html, headers, statusCode);
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
