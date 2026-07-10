import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  clearAlerts,
  eventDetail,
  listAlertMarkers,
  listEvents,
  markAlerted,
  monthKey,
  pruneEvents,
  type MonitorEvent,
} from '@/lib/monitor';

// Detect-and-notify monitoring endpoint. Read-only against the app: it probes
// health, counts the failure events recorded by /api/generate and
// /api/generate-image, and emails alerts via Resend. The only writes are its
// own monitor/* state files. It never fixes, deploys, or mutates anything
// else.
//
// Triggered by GitHub Actions (.github/workflows/monitor.yml):
//   GET /api/monitor           — hourly checks + immediate alerts
//   GET /api/monitor?digest=1  — daily digest (storage %, spend proxy, all-good)
// Auth: Authorization: Bearer <MONITOR_SECRET>. Unset secret = always 401.

export const dynamic = 'force-dynamic';
// Monitoring MUST see live state: without this, Next's Data Cache serves the
// supabase storage list() calls from cache inside this GET handler (observed
// in dev: frozen listings, 9ms responses). force-dynamic alone does not
// disable fetch caching.
export const fetchCache = 'force-no-store';
export const maxDuration = 60; // digest walks storage listings

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MUTE_MS = 6 * HOUR_MS;            // re-alert on a persisting condition at most every 6h
const GEN_FAIL_THRESHOLD = 3;           // deck-generation failures per hour
const R429_THRESHOLD = 5;               // Replicate rate-limit events per hour
const STORAGE_WARN_RATIO = 0.8;         // digest warning at 80% of plan limit
const STORAGE_LIMIT_MB = Number(process.env.SUPABASE_STORAGE_LIMIT_MB ?? 1024); // Supabase free plan: 1 GB

interface Condition {
  key: string;      // mute-marker key
  subject: string;
  body: string;
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.MONITOR_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

async function sendEmail(subject: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL;
  if (!key || !to) {
    console.warn('[monitor] RESEND_API_KEY / ALERT_EMAIL not set — email skipped:', subject);
    return false;
  }
  // Resend REST API directly — no SDK dependency. Free tier sends from
  // onboarding@resend.dev to the account owner's address only.
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Deckify Monitor <onboarding@resend.dev>',
      to: [to],
      subject,
      text,
    }),
  });
  if (!res.ok) {
    console.error('[monitor] Resend send failed:', res.status, (await res.text()).slice(0, 200));
  }
  return res.ok;
}

function since(events: MonitorEvent[], type: string, cutoff: number): MonitorEvent[] {
  return events.filter(e => e.type === type && e.t >= cutoff);
}

// Newest matching event's detail, for alert emails. Best-effort.
async function latestDetail(events: MonitorEvent[]): Promise<string> {
  const newest = events.reduce<MonitorEvent | null>((a, e) => (!a || e.t > a.t ? e : a), null);
  if (!newest) return '';
  const detail = await eventDetail(newest.path);
  return detail ? `\nLast error: ${detail}` : '';
}

// ---------------------------------------------------------------------------
// Probes (read-only against Supabase)
// ---------------------------------------------------------------------------

async function probeSupabase(): Promise<{ auth: string | null; db: string | null }> {
  const admin = createAdminClient();
  let auth: string | null = null;
  let db: string | null = null;
  try {
    const { error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (error) auth = error.message;
  } catch (err) {
    auth = err instanceof Error ? err.message : String(err);
  }
  try {
    const { error } = await admin.from('profiles').select('user_id').limit(1);
    if (error) db = error.message;
  } catch (err) {
    db = err instanceof Error ? err.message : String(err);
  }
  return { auth, db };
}

// Supabase storage listings are per-folder, not recursive — walk with a depth
// cap and an object budget so a huge bucket can't blow the 60s window.
async function walkBucketBytes(
  bucket: string,
  prefix: string,
  depth: number,
  budget: { n: number },
): Promise<number> {
  if (depth > 4 || budget.n <= 0) return 0;
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data) return 0;
  let total = 0;
  for (const item of data) {
    if (budget.n-- <= 0) break;
    const path = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      total += await walkBucketBytes(bucket, path, depth + 1, budget);
    } else {
      total += (item.metadata as { size?: number } | null)?.size ?? 0;
    }
  }
  return total;
}

async function totalStorageMB(): Promise<{ mb: number; buckets: Record<string, number> }> {
  const admin = createAdminClient();
  const { data: buckets } = await admin.storage.listBuckets();
  const perBucket: Record<string, number> = {};
  const budget = { n: 5000 };
  for (const b of buckets ?? []) {
    perBucket[b.name] = await walkBucketBytes(b.name, '', 0, budget);
  }
  const totalBytes = Object.values(perBucket).reduce((a, v) => a + v, 0);
  const round = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 10) / 10;
  return {
    mb: round(totalBytes),
    buckets: Object.fromEntries(Object.entries(perBucket).map(([k, v]) => [k, round(v)])),
  };
}

// ---------------------------------------------------------------------------
// Hourly mode: thresholds + immediate alerts (6h mute, cleared on recovery)
// ---------------------------------------------------------------------------

async function runHourly() {
  const now = Date.now();
  const conditions: Condition[] = [];

  const probes = await probeSupabase();
  if (probes.auth) {
    conditions.push({
      key: 'supabase_auth',
      subject: 'Deckify alert: Supabase auth failing',
      body: `The Supabase auth probe failed:\n${probes.auth}\n\nLogins and API auth are likely broken.`,
    });
  }
  if (probes.db) {
    conditions.push({
      key: 'supabase_db',
      subject: 'Deckify alert: Supabase database failing',
      body: `The profiles-table probe failed:\n${probes.db}\n\nCredits and deck generation are likely broken.`,
    });
  }

  const events = await listEvents();
  const hourAgo = now - HOUR_MS;

  const genFails = since(events, 'generate_error', hourAgo);
  if (genFails.length >= GEN_FAIL_THRESHOLD) {
    conditions.push({
      key: 'gen_failures',
      subject: `Deckify alert: deck generation failed ${genFails.length}x in the last hour`,
      body: `/api/generate returned errors ${genFails.length} times in the last 60 minutes (threshold: ${GEN_FAIL_THRESHOLD}).${await latestDetail(genFails)}`,
    });
  }

  const r402 = since(events, 'replicate_402', hourAgo);
  if (r402.length >= 1) {
    conditions.push({
      key: 'replicate_402',
      subject: 'Deckify alert: Replicate out of credit (402)',
      body: `Replicate returned 402 Payment Required ${r402.length}x in the last hour. AI image generation is down until credit is topped up at replicate.com/account/billing.${await latestDetail(r402)}`,
    });
  }

  const r429 = since(events, 'replicate_429', hourAgo);
  if (r429.length >= R429_THRESHOLD) {
    conditions.push({
      key: 'replicate_429',
      subject: `Deckify alert: Replicate rate-limited ${r429.length}x in the last hour`,
      body: `Replicate 429s exhausted retries ${r429.length} times in the last 60 minutes (threshold: ${R429_THRESHOLD}). Image generation is degraded.${await latestDetail(r429)}`,
    });
  }

  // Mute bookkeeping via marker files: alert once per condition per 6h while
  // it persists; delete the marker on recovery so the next occurrence alerts
  // immediately.
  const markers = await listAlertMarkers();
  const active = new Set(conditions.map(c => c.key));
  const sent: string[] = [];
  const muted: string[] = [];

  for (const cond of conditions) {
    const last = markers[cond.key] ?? 0;
    if (now - last >= MUTE_MS) {
      const ok = await sendEmail(cond.subject, `${cond.body}\n\n(Repeat alerts for this condition are muted for 6 hours.)`);
      if (ok) await markAlerted(cond.key);
      sent.push(cond.key);
    } else {
      muted.push(cond.key);
    }
  }
  const recovered = Object.keys(markers).filter(k => !active.has(k));
  await clearAlerts(recovered);

  const pruned = await pruneEvents(events, now);

  return {
    mode: 'hourly' as const,
    probes,
    lastHour: {
      generate_errors: genFails.length,
      replicate_402: r402.length,
      replicate_429: r429.length,
    },
    conditions: conditions.map(c => c.key),
    alertsSent: sent,
    alertsMuted: muted,
    recovered,
    pruned,
  };
}

// ---------------------------------------------------------------------------
// Digest mode: daily summary — always emails (dead-man's switch)
// ---------------------------------------------------------------------------

async function runDigest() {
  const now = Date.now();
  const warnings: string[] = [];

  const probes = await probeSupabase();
  if (probes.auth) warnings.push(`Supabase auth probe failing: ${probes.auth}`);
  if (probes.db) warnings.push(`Supabase DB probe failing: ${probes.db}`);

  const storage = await totalStorageMB();
  const ratio = storage.mb / STORAGE_LIMIT_MB;
  if (ratio >= STORAGE_WARN_RATIO) {
    warnings.push(`Storage at ${storage.mb} MB of ${STORAGE_LIMIT_MB} MB (${Math.round(ratio * 100)}%) — nearing the plan limit.`);
  }

  const events = await listEvents();
  const dayAgo = now - DAY_MS;
  const counts = {
    generate_errors: since(events, 'generate_error', dayAgo).length,
    replicate_402: since(events, 'replicate_402', dayAgo).length,
    replicate_429: since(events, 'replicate_429', dayAgo).length,
    image_errors: since(events, 'image_error', dayAgo).length,
  };
  if (counts.replicate_402 > 0) {
    warnings.push(`Replicate returned 402 (out of credit) ${counts.replicate_402}x in the last 24h.`);
  }

  const month = monthKey(now);
  const imagesThisMonth = events.filter(e => e.type === 'image_ok' && monthKey(e.t) === month).length;

  const lines = [
    warnings.length === 0 ? 'All checks passing.' : `${warnings.length} warning(s):`,
    ...warnings.map(w => `- ${w}`),
    '',
    `Last 24h: ${counts.generate_errors} generation errors, ${counts.replicate_429} Replicate 429s, ${counts.image_errors} other image errors.`,
    `Storage: ${storage.mb} MB / ${STORAGE_LIMIT_MB} MB (${Math.round(ratio * 100)}%) — ${Object.entries(storage.buckets).map(([k, v]) => `${k}: ${v} MB`).join(', ')}`,
    `AI images generated this month: ${imagesThisMonth} (Replicate has no balance API — this count is the spend proxy; 402 alerts fire the moment credit actually runs out).`,
  ];

  const subject = warnings.length === 0
    ? 'Deckify daily: all good'
    : `Deckify daily: ${warnings.length} warning(s)`;
  const emailed = await sendEmail(subject, lines.join('\n'));

  return { mode: 'digest' as const, warnings, counts, storage, imagesThisMonth, emailed };
}

// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const digest = request.nextUrl.searchParams.get('digest') === '1';
    const result = digest ? await runDigest() : await runHourly();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'monitor run failed';
    console.error('[monitor] run error:', message);
    // Surface as 500 so the GitHub Actions fallback alert fires.
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
