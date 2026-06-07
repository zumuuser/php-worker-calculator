# Calculation Formula

## Base Formula

```
workers = (base_workers × site_type × dynamic_factor × logged_in_factor × cache_efficiency)
          + plugin_overhead + admin_overhead + performance_overhead + burst_headroom
```

## Step-by-Step

### 1. Peak Concurrent Users

If the user provides peak concurrent users, we use that. Otherwise, we estimate:

```
sessions_per_day = monthly_unique_visitors / 30
peak_users = sessions_per_day × peak_percentage_of_daily
concurrent_from_traffic = (sessions_per_day × avg_session_duration_min) / (24 × 60) × pages_per_session
peak = max(peak_users, concurrent_from_traffic × 3)
```

### 2. Base Workers

```
requests_per_worker = 25  // 1 worker handles ~25 concurrent cached requests
base_workers = ceil(peak / requests_per_worker)
```

### 3. Site Type Multiplier

| Site Type | Multiplier | Reason |
|-----------|-----------|--------|
| Blog / Content | 1.0 | Mostly cached |
| Directory / Booking | 2.0 | Search queries are dynamic |
| WooCommerce | 2.5 | Cart/checkout bypass cache |
| SaaS / Web App | 2.5 | Heavy dynamic logic |
| Membership | 3.5 | Logged-in users bypass page cache |
| LMS / Course | 3.5 | Same as membership + video |
| Mixed | 2.0 | Average of common setups |

### 4. Dynamic Content Factor

```
dynamic_factor = 1 + (dynamic_content_percent / 100)
```

At 50% dynamic content, factor = 1.5

### 5. Logged-in Traffic Factor

```
logged_in_factor = 1 + (logged_in_traffic_percent / 100) × 0.5
```

Logged-in users bypass page cache but may hit object cache.

### 6. Cache Efficiency

```
cache_efficiency = 1.0
if no object cache: +0.30
if no CDN: +0.10
if no page cache plugin: +0.15
```

### 7. Plugin Overhead

```
plugin_overhead = ceil((active_plugin_count + detected_heavy_plugins) / 5)
```

### 8. Admin Overhead

```
admin_overhead = ceil(admin_user_count / 5)
```

### 9. Performance Overhead

```
performance_overhead = 0
if avg_php_response > 800ms: +20% of base_workers
if avg_php_response > 500ms: +10% of base_workers
if ttfb > 800ms: +15% of base_workers
```

### 10. Burst Headroom

```
burst_headroom = ceil(raw_workers × 0.25)
```

### 11. Final Workers

```
recommended_workers = raw_workers + burst_headroom
```

## Capacity Reverse-Calculation

Given `X` workers, how much traffic can you handle?

```
max_concurrent = floor(X × 25 / (site_type × dynamic_factor × logged_in_factor × cache_efficiency))
max_monthly_pageviews = max_concurrent × (24 × 60 / avg_session_duration) × 30 × pages_per_session
```

## Tier Mapping

| Workers | Tier |
|---------|------|
| 1–5 | Starter |
| 6–10 | Growth |
| 11–20 | Business |
| 21–40 | Scale |
| 41–70 | Enterprise Small |
| 71–110 | Enterprise Large |
| 110+ | Custom / Dedicated |

## Example

**Inputs:**
- 50,000 monthly pageviews
- WooCommerce
- 30% dynamic content
- 10% logged-in traffic
- 20 plugins
- No object cache
- No CDN
- 500ms PHP response time

**Calculation:**
1. Peak concurrent ≈ 35 users
2. Base workers = ceil(35 / 25) = 2
3. WooCommerce multiplier = 2.5 → 5
4. Dynamic 30% → 1.3 → 6.5
5. Logged-in 10% → 1.05 → 6.8
6. No cache → 1.55 → 10.5
7. Plugin overhead = ceil(20 / 5) = 4 → 14.5
8. Admin overhead = 0 → 14.5
9. Performance overhead = 10% → 16
10. Burst 25% → **20 workers**

**Tier:** Business
