# Self-Hosting Guide

## Vercel

1. Fork the repository on GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your fork
5. Framework preset: Next.js
6. Click Deploy

## Netlify

1. Fork the repository on GitHub
2. Go to [app.netlify.com](https://app.netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your fork
5. Build settings:
   - Build command: `next build`
   - Publish directory: `dist`
6. Click Deploy

## Cloudflare Pages

1. Fork the repository on GitHub
2. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
3. Pages → Create a project
4. Connect to Git → Select your fork
5. Framework preset: Next.js
6. Build command: `next build`
7. Deploy

## Custom Domain

All platforms support custom domains. Follow your platform's DNS instructions after deployment.
