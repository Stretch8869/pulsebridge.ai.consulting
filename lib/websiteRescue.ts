import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

export type RescueCategory = 'SEO Foundations' | 'Technical Basics' | 'AI/Schema Readiness' | 'Conversion Readiness';
export type CheckStatus = 'pass' | 'warn' | 'fail';

export type RescueCheck = {
  id: string;
  label: string;
  category: RescueCategory;
  status: CheckStatus;
  earned: number;
  weight: number;
  detail: string;
  why: string;
};

export type WebsiteRescueScan = {
  requestedUrl: string;
  finalUrl: string;
  score: number;
  label: 'Critical' | 'Needs Work' | 'Good' | 'Strong';
  categoryScores: Record<RescueCategory, number>;
  checks: RescueCheck[];
  topFixes: RescueCheck[];
  responseTimeMs: number;
  fetchedAt: string;
  disclaimer: string;
};

const MAX_BYTES = 1_000_000;
const MAX_REDIRECTS = 4;
const FETCH_TIMEOUT_MS = 8_000;

function isPrivateIpv4(ip: string) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => !Number.isInteger(n) || n < 0 || n > 255)) return true;
  const [a, b] = p;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIp(ip: string) {
  if (isIP(ip) === 4) return isPrivateIpv4(ip);
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v === '::' || v === '::1' || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || v.startsWith('fc') || v.startsWith('fd')) return true;
    if (v.startsWith('::ffff:')) return isPrivateIpv4(v.replace('::ffff:', ''));
  }
  return false;
}

async function validateTarget(raw: string) {
  let candidate = raw.trim();
  if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
  const url = new URL(candidate);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Only http and https websites can be scanned.');
  if (url.username || url.password) throw new Error('URLs with embedded credentials are not allowed.');
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host === 'metadata.google.internal') {
    throw new Error('That host is not allowed.');
  }
  if (isIP(host) && isBlockedIp(host)) throw new Error('Private or local network addresses cannot be scanned.');
  const records = await lookup(host, { all: true, verbatim: true });
  if (!records.length || records.some(r => isBlockedIp(r.address))) throw new Error('That host resolves to a private or unsafe network address.');
  return url;
}

async function readLimitedHtml(res: Response) {
  const length = Number(res.headers.get('content-length') || 0);
  if (length > MAX_BYTES) throw new Error('The homepage is too large for the quick scan.');
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error('The homepage is too large for the quick scan.');
    }
    chunks.push(value);
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

async function fetchHomepage(rawUrl: string) {
  let current = await validateTarget(rawUrl);
  const started = Date.now();
  for (let i = 0; i <= MAX_REDIRECTS; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(current, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': 'PulseBridge-Website-Rescue/1.0',
          accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        },
        cache: 'no-store',
      });
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) throw new Error('The website returned an invalid redirect.');
        if (i === MAX_REDIRECTS) throw new Error('The website redirected too many times.');
        current = await validateTarget(new URL(location, current).toString());
        continue;
      }
      const type = (res.headers.get('content-type') || '').toLowerCase();
      if (type && !type.includes('text/html') && !type.includes('application/xhtml+xml')) throw new Error('The URL did not return an HTML webpage.');
      const html = await readLimitedHtml(res);
      return { html, status: res.status, finalUrl: current.toString(), responseTimeMs: Date.now() - started };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw new Error('The website took too long to respond.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
  throw new Error('Could not scan that website.');
}

const decode = (s: string) => s.replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;/gi, "'").replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const match = (html: string, re: RegExp) => decode((html.match(re)?.[1] || '').trim());
const count = (html: string, re: RegExp) => (html.match(re) || []).length;

function addCheck(checks: RescueCheck[], check: RescueCheck) {
  checks.push(check);
}

function scoreLabel(score: number): WebsiteRescueScan['label'] {
  if (score < 50) return 'Critical';
  if (score < 75) return 'Needs Work';
  if (score < 90) return 'Good';
  return 'Strong';
}

function analyzeHtml(requestedUrl: string, finalUrl: string, html: string, status: number, responseTimeMs: number): WebsiteRescueScan {
  const checks: RescueCheck[] = [];
  const lower = html.toLowerCase();
  const title = match(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  const description = match(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i) || match(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i);
  const h1Count = count(html, /<h1\b[^>]*>/gi);
  const imageCount = count(html, /<img\b[^>]*>/gi);
  const imageAltCount = count(html, /<img\b(?=[^>]*\balt=["'][^"']*["'])[^>]*>/gi);
  const internalLinkCount = count(html, /<a\b[^>]+href=["'](?:\/|#|\.\/|\.\.\/)[^"']*["'][^>]*>/gi);
  const text = decode(html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' '));
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const robots = match(html, /<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["'][^>]*>/i) || match(html, /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["'][^>]*>/i);
  const noindex = /\bnoindex\b/i.test(robots);
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["'][^"']*canonical[^"']*["']/i.test(html);
  const hasSchema = /<script[^>]+type=["']application\/ld\+json["']/i.test(html) || /\bitemtype=["']https?:\/\/schema\.org\//i.test(html);
  const hasLang = /<html[^>]+lang=["'][^"']+["']/i.test(html);
  const ogCount = ['og:title', 'og:description', 'og:image'].filter(k => new RegExp(`<meta[^>]+property=["']${k}["']`, 'i').test(html)).length;
  const hasCta = /\b(book|schedule|get started|request|contact|call now|get quote|free quote|estimate|buy now|shop now|sign up|start now|learn more)\b/i.test(text);
  const hasContact = /href=["'](?:tel:|mailto:)/i.test(html) || /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text) || /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  const hasActionElement = /<(form|button)\b/i.test(html) || /<a\b[^>]+class=["'][^"']*(btn|button|cta)[^"']*["']/i.test(html);

  addCheck(checks, { id: 'https', label: 'HTTPS enabled', category: 'Technical Basics', status: finalUrl.startsWith('https://') ? 'pass' : 'fail', earned: finalUrl.startsWith('https://') ? 8 : 0, weight: 8, detail: finalUrl.startsWith('https://') ? 'The scanned page is served over HTTPS.' : 'The final page is not using HTTPS.', why: 'HTTPS protects visitors and is a basic trust and search-quality signal.' });
  addCheck(checks, { id: 'response', label: 'Homepage responds successfully', category: 'Technical Basics', status: status >= 200 && status < 400 ? 'pass' : 'fail', earned: status >= 200 && status < 400 ? 8 : 0, weight: 8, detail: `Homepage returned HTTP ${status}.`, why: 'Search engines and visitors need a reliably reachable page.' });
  addCheck(checks, { id: 'viewport', label: 'Mobile viewport configured', category: 'Technical Basics', status: hasViewport ? 'pass' : 'fail', earned: hasViewport ? 5 : 0, weight: 5, detail: hasViewport ? 'Viewport meta tag found.' : 'No viewport meta tag was detected.', why: 'The viewport tag is a basic requirement for mobile-friendly rendering.' });
  addCheck(checks, { id: 'canonical', label: 'Canonical URL declared', category: 'Technical Basics', status: hasCanonical ? 'pass' : 'warn', earned: hasCanonical ? 4 : 2, weight: 4, detail: hasCanonical ? 'Canonical link found.' : 'No canonical link was detected.', why: 'Canonical URLs help search engines understand the preferred version of a page.' });

  const titleGood = title.length >= 15 && title.length <= 65;
  addCheck(checks, { id: 'title', label: 'Page title', category: 'SEO Foundations', status: !title ? 'fail' : titleGood ? 'pass' : 'warn', earned: !title ? 0 : titleGood ? 8 : 5, weight: 8, detail: !title ? 'No title tag was detected.' : `Title length: ${title.length} characters.`, why: 'A clear title helps search engines and users understand the page topic.' });
  const descGood = description.length >= 70 && description.length <= 170;
  addCheck(checks, { id: 'description', label: 'Meta description', category: 'SEO Foundations', status: !description ? 'fail' : descGood ? 'pass' : 'warn', earned: !description ? 0 : descGood ? 7 : 4, weight: 7, detail: !description ? 'No meta description was detected.' : `Description length: ${description.length} characters.`, why: 'A useful description can improve how the page is presented in search results.' });
  addCheck(checks, { id: 'h1', label: 'Primary H1 heading', category: 'SEO Foundations', status: h1Count === 1 ? 'pass' : h1Count > 1 ? 'warn' : 'fail', earned: h1Count === 1 ? 7 : h1Count > 1 ? 4 : 0, weight: 7, detail: `${h1Count} H1 heading${h1Count === 1 ? '' : 's'} detected.`, why: 'A clear primary heading reinforces page topic and hierarchy.' });
  addCheck(checks, { id: 'robots', label: 'Indexing is not obviously blocked', category: 'SEO Foundations', status: noindex ? 'fail' : 'pass', earned: noindex ? 0 : 5, weight: 5, detail: noindex ? 'A robots noindex directive was detected.' : 'No obvious noindex directive was detected on the page.', why: 'A noindex directive prevents the page from appearing in normal search results.' });
  addCheck(checks, { id: 'words', label: 'Useful homepage text depth', category: 'SEO Foundations', status: wordCount >= 250 ? 'pass' : wordCount >= 100 ? 'warn' : 'fail', earned: wordCount >= 250 ? 4 : wordCount >= 100 ? 2 : 0, weight: 4, detail: `Approximately ${wordCount} visible words detected.`, why: 'Enough useful text helps explain the offer and gives search systems context.' });
  const altRatio = imageCount ? imageAltCount / imageCount : 1;
  addCheck(checks, { id: 'alts', label: 'Image alt coverage', category: 'SEO Foundations', status: altRatio >= 0.8 ? 'pass' : altRatio >= 0.5 ? 'warn' : 'fail', earned: altRatio >= 0.8 ? 4 : altRatio >= 0.5 ? 2 : 0, weight: 4, detail: imageCount ? `${imageAltCount} of ${imageCount} images include alt attributes.` : 'No images were detected on the homepage.', why: 'Alt text supports accessibility and gives search systems more context about images.' });

  addCheck(checks, { id: 'schema', label: 'Structured data / schema', category: 'AI/Schema Readiness', status: hasSchema ? 'pass' : 'fail', earned: hasSchema ? 12 : 0, weight: 12, detail: hasSchema ? 'Structured data markup was detected.' : 'No JSON-LD or basic schema markup was detected.', why: 'Structured data gives search and AI systems machine-readable context about the business and content.' });
  addCheck(checks, { id: 'og', label: 'Open Graph metadata', category: 'AI/Schema Readiness', status: ogCount === 3 ? 'pass' : ogCount >= 1 ? 'warn' : 'fail', earned: ogCount === 3 ? 5 : ogCount >= 1 ? 3 : 0, weight: 5, detail: `${ogCount} of 3 core Open Graph fields detected.`, why: 'Open Graph metadata improves how pages are described when shared and gives parsers cleaner page context.' });
  addCheck(checks, { id: 'lang', label: 'Page language declared', category: 'AI/Schema Readiness', status: hasLang ? 'pass' : 'warn', earned: hasLang ? 3 : 1, weight: 3, detail: hasLang ? 'HTML language attribute found.' : 'No HTML lang attribute was detected.', why: 'Explicit language helps assistive technology and automated systems interpret page content.' });

  addCheck(checks, { id: 'cta', label: 'Clear call-to-action language', category: 'Conversion Readiness', status: hasCta ? 'pass' : 'fail', earned: hasCta ? 8 : 0, weight: 8, detail: hasCta ? 'Action-oriented CTA language was detected.' : 'No obvious action-oriented CTA language was detected.', why: 'Visitors convert more reliably when the next step is obvious.' });
  addCheck(checks, { id: 'contact', label: 'Easy contact path', category: 'Conversion Readiness', status: hasContact ? 'pass' : 'fail', earned: hasContact ? 6 : 0, weight: 6, detail: hasContact ? 'A phone, email, tel link, or mail link was detected.' : 'No obvious phone or email contact path was detected.', why: 'Service-business visitors need a low-friction way to contact the company.' });
  addCheck(checks, { id: 'links', label: 'Internal navigation depth', category: 'Conversion Readiness', status: internalLinkCount >= 3 ? 'pass' : internalLinkCount >= 1 ? 'warn' : 'fail', earned: internalLinkCount >= 3 ? 4 : internalLinkCount >= 1 ? 2 : 0, weight: 4, detail: `${internalLinkCount} obvious internal links detected.`, why: 'Internal links help visitors and search systems reach important service and trust pages.' });
  addCheck(checks, { id: 'action', label: 'Action element present', category: 'Conversion Readiness', status: hasActionElement ? 'pass' : 'warn', earned: hasActionElement ? 2 : 1, weight: 2, detail: hasActionElement ? 'A form, button, or button-like link was detected.' : 'No form or obvious button element was detected.', why: 'A visible action element reduces friction between interest and inquiry.' });

  const score = Math.max(0, Math.min(100, Math.round(checks.reduce((sum, c) => sum + c.earned, 0))));
  const categories: RescueCategory[] = ['SEO Foundations', 'Technical Basics', 'AI/Schema Readiness', 'Conversion Readiness'];
  const categoryScores = Object.fromEntries(categories.map(category => {
    const group = checks.filter(c => c.category === category);
    const earned = group.reduce((s, c) => s + c.earned, 0);
    const weight = group.reduce((s, c) => s + c.weight, 0);
    return [category, Math.round((earned / weight) * 100)];
  })) as Record<RescueCategory, number>;
  const topFixes = checks.filter(c => c.status !== 'pass').sort((a, b) => (b.weight - b.earned) - (a.weight - a.earned) || b.weight - a.weight).slice(0, 3);

  return {
    requestedUrl,
    finalUrl,
    score,
    label: scoreLabel(score),
    categoryScores,
    checks,
    topFixes,
    responseTimeMs,
    fetchedAt: new Date().toISOString(),
    disclaimer: 'This quick scan inspects observable homepage HTML and response behavior. It does not measure Google rankings, backlinks, search volume, traffic, Lighthouse/Core Web Vitals, competitors, revenue, or a full crawl.',
  };
}

export async function scanWebsite(rawUrl: string) {
  const { html, status, finalUrl, responseTimeMs } = await fetchHomepage(rawUrl);
  return analyzeHtml(rawUrl, finalUrl, html, status, responseTimeMs);
}
