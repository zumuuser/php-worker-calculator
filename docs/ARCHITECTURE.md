# Architecture

## Overview

PHP Worker Calculator is a static Next.js application that runs entirely in the user's browser. There is no backend server, no database, and no user tracking.

## Data Flow

```
User enters domain
    ↓
[Auto-Detection Engine] (lib/scraper.ts)
    ├── robots.txt check
    ├── sitemap.xml fetch (if allowed)
    ├── homepage HTML fetch (if allowed)
    └── PageSpeed Insights API call
    ↓
[Input Form] (components/input-form.tsx)
    ├── Auto-populated fields from detection
    └── Manual fields from user
    ↓
[Calculation Engine] (lib/calculator.ts)
    ├── Base workers from concurrent users
    ├── Multipliers (site type, dynamic %, logged-in %)
    ├── Overheads (plugins, admins, performance)
    └── Burst headroom (+25%)
    ↓
[Output Views]
    ├── SimpleResult — big number + tier
    ├── DetailedReport — charts + breakdown + tips
    └── ExportPDF — html2canvas + jsPDF
    ↓
[localStorage]
    └── Save last 10 reports
```

## Auto-Detection

We only fetch public data and respect robots.txt:

1. **robots.txt** — Parsed to check if sitemap and homepage fetching is allowed
2. **Sitemap** — Counts `<url>` entries to estimate site size (capped at 10,000)
3. **Homepage HTML** — Single fetch, regex-based detection of:
   - WordPress meta generator
   - WooCommerce strings
   - Elementor, MemberPress, LearnDash, BuddyBoss
   - Cache plugins (WP Rocket, LiteSpeed, W3 Total Cache)
   - Cloudflare headers/scripts
4. **PageSpeed Insights** — Free API for TTFB, LCP, CLS

No aggressive scanning. No multiple requests. No crawling.

## Calculation Engine

See [FORMULA.md](FORMULA.md) for the mathematical model.

## Privacy

- All detection happens client-side (user's own IP)
- No cookies, no analytics, no tracking
- localStorage only stores report data locally
- PDF generation happens entirely in the browser
