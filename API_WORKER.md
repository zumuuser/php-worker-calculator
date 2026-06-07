# Detection Proxy (Cloudflare Worker)

The PHP Worker Calculator runs entirely in your browser on GitHub Pages. This creates a fundamental limitation: **browsers block cross-origin requests via CORS**. When you try to analyze `nba.com` from `github.io`, the browser refuses to fetch the site.

The **Detection Proxy** solves this with a tiny Cloudflare Worker that fetches websites **server-side** and returns full tech detection as JSON.

## How It Works

```
┌─────────────────┐      ┌─────────────────────┐      ┌──────────────┐
│  Your Browser   │ ──▶  │  Cloudflare Worker  │ ──▶  │  nba.com     │
│  (GitHub Pages) │ ◀──  │  (server-side)      │ ◀──  │  (no CORS)   │
└─────────────────┘      └─────────────────────┘      └──────────────┘
         ▲                         │
         └──────── JSON results ───┘
```

Without the worker:
- ❌ Homepage fetch blocked by CORS
- ❌ Sitemap fetch blocked by CORS
- ✅ PageSpeed Insights works (Google allows CORS)
- ✅ DNS detection works (Cloudflare DoH)

With the worker:
- ✅ Homepage fetch works (server-side)
- ✅ Sitemap fetch works (server-side)
- ✅ PageSpeed Insights works
- ✅ DNS detection works
- ✅ Full plugin/CMS/framework detection

## Deploy in 60 Seconds

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com/) → **Workers & Pages** → **Create**
2. Click **Create Worker** → **Deploy**
3. Click **Edit Code**
4. Delete the default code and paste the contents of [`worker/worker.js`](./worker/worker.js)
5. Click **Deploy**
6. Copy your worker URL: `https://php-worker-proxy.YOUR-NAME.workers.dev`
7. Open the [live calculator](https://zumuuser.github.io/php-worker-calculator/)
8. Click **APIs** in the top-right header
9. Paste your worker URL in the "Worker URL" field
10. Run an analysis — detection is now 100% reliable

## Free Tier

Cloudflare Workers free tier includes **100,000 requests/day**. You will never hit this limit for personal use.

## Privacy

The worker is stateless. It fetches, analyzes, and returns data immediately. No logs, no tracking, no data retention.

## Alternative: No Worker

If you prefer not to deploy a worker, the calculator still works with:
- **DNS detection** (always reliable — hosting/CDN/email provider)
- **PageSpeed Insights** (always reliable — TTFB/LCP/CLS)
- **CORS proxies** (unreliable — many sites block them)
- **Manual input** (always available)

## Troubleshooting

**"Worker URL not working"**
- Make sure you deployed the worker and copied the correct URL
- Test it directly: `https://your-worker.workers.dev/analyze?url=example.com`
- Check that the worker shows `"status": "ok"` at the root URL

**"Some sites still fail"**
- Some sites block Cloudflare's IP ranges
- Some sites require specific headers or cookies
- The worker attempts a standard `fetch()` — very aggressive bot protection may still block it
