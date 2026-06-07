# Contributing

## Adding New Tech Detections

Edit `lib/scraper.ts`:

```typescript
const HEAVY_PLUGINS = [
  // Add your plugin string here (lowercase)
  "my-plugin",
];
```

The detection scans homepage HTML for these strings.

## Modifying the Formula

Edit `lib/calculator.ts`:

1. Add new factors to `CalculationResult` interface in `types/index.ts`
2. Update the `calculateWorkers` function
3. Add corresponding `WorkerBreakdown` entries
4. Update `FORMULA.md` documentation

## Running Locally

```bash
npm install
npm run dev
```

## Building for Production

```bash
npm run build
# Output is in /dist
```

## Code Style

- TypeScript strict mode
- Tailwind CSS for all styling
- Lucide icons only
- Client components marked with `"use client"`
