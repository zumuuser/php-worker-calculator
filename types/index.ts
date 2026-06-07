export interface DetectedPlugin {
  slug: string;
  name: string;
  category: 'ecommerce' | 'seo' | 'cache' | 'security' | 'forms' | 'page-builder' | 'membership' | 'lms' | 'backup' | 'analytics' | 'other';
}

export interface DetectedTech {
  cms: string | null;
  cmsVersion: string | null;
  phpVersion: string | null;
  theme: string | null;
  themeVersion: string | null;
  isWordPress: boolean;
  hasWooCommerce: boolean;
  hasElementor: boolean;
  hasMemberPress: boolean;
  hasLearnDash: boolean;
  hasBuddyBoss: boolean;
  hasContactForm7: boolean;
  hasGravityForms: boolean;
  hasYoast: boolean;
  hasRankMath: boolean;
  hasWPRocket: boolean;
  hasW3TotalCache: boolean;
  hasLiteSpeedCache: boolean;
  hasCloudflare: boolean;
  cachePlugin: string | null;
  heavyPluginsCount: number;
  estimatedPages: number;
  ttfb: number | null;
  lcp: number | null;
  cls: number | null;
  frameworks: string[];
  plugins: DetectedPlugin[];
  serverSoftware: string | null;
}

export interface ScanStatus {
  homepageFetched: boolean;
  sitemapFetched: boolean;
  pageSpeedFetched: boolean;
  dnsFetched: boolean;
  proxyUsed: string | null;
  pageSpeedRateLimited: boolean;
}

export interface DnsInfo {
  nameservers: string[];
  aRecords: string[];
  cnameRecords: string[];
  mxRecords: string[];
  txtRecords: string[];
  hostingProvider: string | null;
  cdnProvider: string | null;
  emailProvider: string | null;
}

export interface ApiKeys {
  workerUrl?: string;
  whatcms?: string;
  urlscan?: string;
  shodan?: string;
}

export interface CalculatorInputs {
  domain: string;
  monthlyPageviews: number;
  monthlyUniqueVisitors: number;
  pagesPerSession: number;
  peakConcurrentUsers: number | null;
  peakPercentageOfDaily: number;
  siteType: 'blog' | 'woocommerce' | 'membership' | 'lms' | 'directory' | 'saas' | 'mixed';
  dynamicContentPercent: number;
  loggedInTrafficPercent: number;
  adminUserCount: number;
  activePluginCount: number;
  objectCacheEnabled: 'yes' | 'no' | 'unknown';
  cdnEnabled: 'yes' | 'no' | 'unknown';
  currentWorkerLimit: number | null;
  avgPhpResponseTimeMs: number;
  detectedTech: DetectedTech;
}

export interface WorkerBreakdown {
  label: string;
  workers: number;
  color: string;
}

export interface CalculationResult {
  recommendedWorkers: number;
  baseWorkers: number;
  dynamicMultiplier: number;
  cacheEfficiency: number;
  siteTypeMultiplier: number;
  pluginOverhead: number;
  adminOverhead: number;
  performanceOverhead: number;
  burstHeadroom: number;
  tier: string;
  maxConcurrentUsers: number;
  maxMonthlyPageviews: number;
  breakdown: WorkerBreakdown[];
  optimizationTips: string[];
  projections: {
    traffic2x: number;
    traffic5x: number;
    traffic10x: number;
  };
}

export interface SavedReport {
  id: string;
  domain: string;
  timestamp: number;
  inputs: CalculatorInputs;
  result: CalculationResult;
}
