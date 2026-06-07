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

const HOSTING_PATTERNS: Record<string, string> = {
  "awsdns": "Amazon Web Services",
  "cloudflare": "Cloudflare",
  "googledomains": "Google Domains",
  "domaincontrol": "GoDaddy",
  "worldnic": "Network Solutions",
  " registrar-servers": "Namecheap",
  "digitalocean": "DigitalOcean",
  "linode": "Linode",
  "hetzner": "Hetzner",
  "ovh": "OVHcloud",
  "azure-dns": "Microsoft Azure",
  "dnsmadeeasy": "DNS Made Easy",
  "nsone": "NS1",
  "dyn": "Dyn DNS",
  " ultradns": "UltraDNS",
};

const CDN_PATTERNS: Record<string, string> = {
  "cloudflare": "Cloudflare",
  "cloudfront": "AWS CloudFront",
  "akamai": "Akamai",
  "edgekey": "Akamai",
  "edgesuite": "Akamai",
  "fastly": "Fastly",
  "googlehosted": "Google Cloud CDN",
  "googleusercontent": "Google",
  "b-cdn": "BunnyCDN",
  "stackpath": "StackPath",
  "keycdn": "KeyCDN",
  "cdn77": "CDN77",
  "incapdns": "Imperva",
  "sucuri": "Sucuri",
};

const EMAIL_PATTERNS: Record<string, string> = {
  "google": "Google Workspace",
  "outlook": "Microsoft 365",
  "microsoft": "Microsoft 365",
  "zoho": "Zoho Mail",
  "protonmail": "ProtonMail",
  "mimecast": "Mimecast",
  "proofpoint": "Proofpoint",
  "mailgun": "Mailgun",
  "sendgrid": "SendGrid",
  "amazonses": "Amazon SES",
  "postmark": "Postmark",
};

async function queryDns(name: string, type: string): Promise<Array<{ data: string }>> {
  try {
    const res = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,
      {
        headers: { Accept: "application/dns-json" },
        cache: "no-store",
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.Answer || []).filter((a: any) => a.type !== 5); // Skip CNAME chains for non-CNAME queries
  } catch {
    return [];
  }
}

function findProvider(texts: string[], patterns: Record<string, string>): string | null {
  const joined = texts.join(" ").toLowerCase();
  for (const [pattern, provider] of Object.entries(patterns)) {
    if (joined.includes(pattern.toLowerCase())) return provider;
  }
  return null;
}

export async function analyzeDns(domain: string): Promise<DnsInfo> {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const wwwDomain = clean.startsWith("www.") ? clean : `www.${clean}`;

  const [ns, a, cname, mx, txt] = await Promise.all([
    queryDns(clean, "NS"),
    queryDns(clean, "A"),
    queryDns(wwwDomain, "CNAME"),
    queryDns(clean, "MX"),
    queryDns(clean, "TXT"),
  ]);

  const nameservers = ns.map((r) => r.data);
  const aRecords = a.map((r) => r.data);
  const cnameRecords = cname.map((r) => r.data);
  const mxRecords = mx.map((r) => r.data);
  const txtRecords = txt.map((r) => r.data);

  return {
    nameservers,
    aRecords,
    cnameRecords,
    mxRecords,
    txtRecords,
    hostingProvider: findProvider(nameservers, HOSTING_PATTERNS),
    cdnProvider: findProvider([...cnameRecords, ...nameservers], CDN_PATTERNS),
    emailProvider: findProvider(mxRecords, EMAIL_PATTERNS),
  };
}
