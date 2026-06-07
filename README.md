# PHP Worker Calculator

A free, open-source tool that calculates exactly how many **PHP workers** your website needs. Built for WordPress, WooCommerce, membership sites, LMS platforms, and any PHP-based application.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **Auto-detects your tech stack** — Respects `robots.txt`, fetches sitemaps, detects plugins & cache setup
- **Deep input form** — 15+ metrics for precise calculation
- **Dual output** — Simple answer for non-technical users + detailed technical report with charts
- **PDF export** — Download a professional report
- **Local history** — Saves reports in your browser with JSON import/export
- **100% client-side** — No data leaves your browser except public API calls
- **Free forever** — No paid APIs required

## Live Demo

**Live URL:** [https://zumuuser.github.io/php-worker-calculator/](https://zumuuser.github.io/php-worker-calculator/)


Deploy to Vercel or Netlify in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/php-worker-calculator)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/php-worker-calculator)

## How It Works

1. **Enter your domain** — We detect WordPress, WooCommerce, cache plugins, and page count
2. **Fine-tune metrics** — Traffic, dynamic content %, logged-in users, plugins, etc.
3. **Get your number** — Recommended workers + hosting tier + capacity limits

### Calculation Formula

```
workers = (peak_concurrent_users × site_type × dynamic_factor × logged_in_factor × cache_efficiency)
          + plugin_overhead + admin_overhead + performance_overhead + burst_headroom
```

See [FORMULA.md](docs/FORMULA.md) for the full breakdown.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- React Hook Form + Zod
- Recharts
- html2canvas + jsPDF

## Self-Hosting

### Vercel

1. Fork this repo
2. Go to [vercel.com](https://vercel.com) → Import Project
3. Select your fork
4. Deploy

### Netlify

1. Fork this repo
2. Go to [app.netlify.com](https://app.netlify.com) → Add new site → Import from Git
3. Select your fork
4. Build command: `next build`
5. Publish directory: `dist`
6. Deploy

### Local Development

```bash
git clone https://github.com/YOUR_USERNAME/php-worker-calculator.git
cd php-worker-calculator
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Optional API Key

Google PageSpeed Insights works without a key (free quota). For higher limits, add your key:

```bash
cp .env.example .env.local
# Edit .env.local and add your PSI_API_KEY
```

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License

MIT © [Your Name](https://github.com/YOUR_USERNAME)
