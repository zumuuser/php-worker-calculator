# PHP Worker Calculator — Detection Proxy

A Cloudflare Worker that fetches websites **server-side** and runs full tech stack detection. Because it runs on Cloudflare's edge network, there are **no CORS issues** — it can access any public website and return results to the browser.

## Why This Exists

Browsers block `fetch()` requests to arbitrary websites via CORS. This means a client-side app on GitHub Pages cannot directly scan `nba.com`, `nytimes.com`, or most other sites. CORS proxies are unreliable and often blocked.

This worker solves that by acting as a **server-side proxy**:

```
Browser (GitHub Pages) → Cloudflare Worker → Target Website
                              ↓
                    Returns JSON with full detection
```

## What It Detects

- **CMS**: WordPress, Shopify, Webflow, Squarespace, Wix, Drupal, Joomla, Magento, Ghost, Next.js, Gatsby, Astro
- **Frameworks**: React, Vue, Angular, Svelte, Nuxt, Remix, jQuery
- **Plugins**: WooCommerce, Elementor, MemberPress, LearnDash, BuddyBoss, Gravity Forms, Contact Form 7, Yoast, Rank Math, WP Rocket, LiteSpeed Cache, W3 Total Cache, and 25+ heavy plugins
- **Infrastructure**: Hosting provider, CDN, email provider (via DNS)
- **Performance**: TTFB, LCP, CLS (via Google PageSpeed Insights)
- **Site scale**: Estimated page count from sitemap

## Deployment (60 Seconds)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** → **Create**
3. Choose **Create Worker**
4. Click **Deploy** to create the worker
5. Click **Edit Code**
6. Delete the default code and **paste the entire contents of `worker.js`**
7. Click **Deploy**
8. Copy your worker URL (e.g. `https://php-worker-proxy.your-name.workers.dev`)
9. Paste it into the calculator's **APIs** settings panel

## Free Tier Limits

Cloudflare Workers free tier includes **100,000 requests/day** — more than enough for personal use.

## API

### `GET /`
Health check.

```json
{
  "name": "PHP Worker Calculator — Detection Proxy",
  "status": "ok",
  "endpoints": {
    "analyze": "/analyze?url=example.com"
  }
}
```

### `GET /analyze?url=example.com`
Analyze a website.

**Response:**
```json
{
  "tech": {
    "cms": "WordPress",
    "isWordPress": true,
    "hasWooCommerce": true,
    "frameworks": ["React", "jQuery"],
    "estimatedPages": 420,
    "ttfb": 245,
    "lcp": 1200,
    "cls": 0.02
  },
  "status": {
    "homepageFetched": true,
    "sitemapFetched": true,
    "pageSpeedFetched": true,
    "dnsFetched": true,
    "proxyUsed": "Cloudflare Worker (server-side)"
  },
  "dns": {
    "hostingProvider": "Cloudflare",
    "cdnProvider": "Cloudflare",
    "nameservers": ["lara.ns.cloudflare.com", "greg.ns.cloudflare.com"]
  }
}
```

## Privacy

The worker does not log or store any data. It performs the analysis and returns the result immediately. No analytics, no tracking, no data retention.

## License

MIT — same as the main project.
