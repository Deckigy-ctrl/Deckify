import { createAdminClient } from '@/lib/supabase/admin';

// Lightweight production monitoring: API routes record failure events here,
// and /api/monitor (triggered hourly by GitHub Actions) reads them to decide
// whether to send alert emails. Detect-and-notify only — nothing in this
// module changes app behavior, and every write is fail-soft: a monitoring
// failure must never surface to a user request.
//
// Storage design (private `deck-data` bucket, no new infrastructure):
//   monitor/events/{ms}-{rand}-{type}.json — one IMMUTABLE file per event
//   monitor/alerts/{condition}.json        — marker file; updated_at = last alerted
//
// Why one file per event instead of one mutable events.json: Supabase serves
// object downloads through a CDN, so re-reading an upserted blob can return a
// stale copy (verified in testing — a read-modify-write cycle clobbered fresh
// events with stale state). Write-once files can't be stale, and counts come
// from storage listings, which are live Postgres queries, not CDN reads.

const BUCKET = 'deck-data';
const EVENTS_PREFIX = 'monitor/events';
const ALERTS_PREFIX = 'monitor/alerts';

// Failure events kept 7 days; image_ok kept ~2 months so the daily digest can
// report a month-to-date generation count (the Replicate spend proxy — no
// public balance API exists).
const EVENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IMAGE_OK_TTL_MS = 62 * 24 * 60 * 60 * 1000;
// One listing page. If event volume ever exceeds this in the retention
// window, counts saturate rather than paginate — fine for alert thresholds.
const LIST_LIMIT = 2000;

export type MonitorEventType =
  | 'generate_error'   // deck generation (/api/generate) failed
  | 'replicate_402'    // Replicate refused: out of credit
  | 'replicate_429'    // Replicate rate limit exhausted retries
  | 'image_error'      // other image-pipeline failure
  | 'image_ok';        // successful AI image generation (spend proxy)

export interface MonitorEvent {
  t: number;               // epoch ms (from the filename)
  type: MonitorEventType;
  path: string;            // bucket-relative path, for detail download / prune
}

function admin() {
  return createAdminClient();
}

let bucketEnsured = false;
async function ensureBucket() {
  if (bucketEnsured) return;
  await admin().storage.createBucket(BUCKET, { public: false }).catch(() => { /* already exists */ });
  bucketEnsured = true;
}

export function monthKey(t = Date.now()): string {
  return new Date(t).toISOString().slice(0, 7); // 'YYYY-MM'
}

/**
 * Record an event as a new immutable file. Fail-soft by design: errors are
 * logged and swallowed so instrumented routes behave exactly as before.
 */
export async function recordMonitorEvent(type: MonitorEventType, detail?: string): Promise<void> {
  try {
    await ensureBucket();
    const t = Date.now();
    const rand = Math.random().toString(36).slice(2, 8);
    const path = `${EVENTS_PREFIX}/${t}-${rand}-${type}.json`;
    const body = JSON.stringify({ at: new Date(t).toISOString(), detail: detail?.slice(0, 300) });
    const { error } = await admin().storage
      .from(BUCKET)
      .upload(path, Buffer.from(body, 'utf-8'), { contentType: 'application/json' });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.warn('[monitor] recordMonitorEvent failed (ignored):', err instanceof Error ? err.message : err);
  }
}

/** Bump the month-to-date successful-image count (digest spend proxy). */
export async function recordImageSuccess(): Promise<void> {
  await recordMonitorEvent('image_ok');
}

/**
 * Classify an image-pipeline error message into a monitor event type.
 * lib/ai/images/replicate.ts embeds the HTTP status in its error messages
 * ("Replicate create failed: HTTP 402 — ...", "Replicate rate limit (429)
 * after 3 retries"), so the status is recoverable here without touching that
 * module.
 */
export function classifyImageError(message: string): MonitorEventType {
  if (/HTTP 402|payment required/i.test(message)) return 'replicate_402';
  if (/\b429\b|rate limit/i.test(message)) return 'replicate_429';
  return 'image_error';
}

const EVENT_TYPES: ReadonlySet<string> = new Set([
  'generate_error', 'replicate_402', 'replicate_429', 'image_error', 'image_ok',
]);

/** List recorded events, newest first (parsed from filenames — always fresh). */
export async function listEvents(): Promise<MonitorEvent[]> {
  const { data, error } = await admin().storage
    .from(BUCKET)
    .list(EVENTS_PREFIX, { limit: LIST_LIMIT, sortBy: { column: 'name', order: 'desc' } });
  if (error) throw new Error(`monitor events list failed: ${error.message}`);
  const events: MonitorEvent[] = [];
  for (const item of data ?? []) {
    const m = item.name.match(/^(\d+)-[a-z0-9]+-([a-z_0-9]+)\.json$/);
    if (!m || !EVENT_TYPES.has(m[2])) continue;
    events.push({ t: Number(m[1]), type: m[2] as MonitorEventType, path: `${EVENTS_PREFIX}/${item.name}` });
  }
  return events;
}

/** Download one event's detail text. Event files are immutable, so this read
 *  can't be stale. Returns null on any failure — detail is cosmetic. */
export async function eventDetail(path: string): Promise<string | null> {
  try {
    const { data, error } = await admin().storage.from(BUCKET).download(path);
    if (error || !data) return null;
    const parsed = JSON.parse(await data.text()) as { detail?: string };
    return parsed.detail ?? null;
  } catch {
    return null;
  }
}

/** Delete expired event files. Returns how many were removed. */
export async function pruneEvents(events: MonitorEvent[], now = Date.now()): Promise<number> {
  const expired = events
    .filter(e => now - e.t > (e.type === 'image_ok' ? IMAGE_OK_TTL_MS : EVENT_TTL_MS))
    .map(e => e.path);
  for (let i = 0; i < expired.length; i += 100) {
    const { error } = await admin().storage.from(BUCKET).remove(expired.slice(i, i + 100));
    if (error) {
      console.warn('[monitor] prune failed (ignored):', error.message);
      break;
    }
  }
  return expired.length;
}

/** condition key -> epoch ms of last alert email, from marker-file listings. */
export async function listAlertMarkers(): Promise<Record<string, number>> {
  const { data, error } = await admin().storage.from(BUCKET).list(ALERTS_PREFIX, { limit: 100 });
  if (error) throw new Error(`monitor alerts list failed: ${error.message}`);
  const markers: Record<string, number> = {};
  for (const item of data ?? []) {
    if (!item.name.endsWith('.json')) continue;
    const ts = Date.parse(item.updated_at ?? item.created_at ?? '');
    if (!Number.isNaN(ts)) markers[item.name.replace(/\.json$/, '')] = ts;
  }
  return markers;
}

/** Mark a condition as alerted now (upsert bumps the marker's updated_at). */
export async function markAlerted(key: string): Promise<void> {
  await ensureBucket();
  const body = Buffer.from(JSON.stringify({ at: new Date().toISOString() }), 'utf-8');
  const { error } = await admin().storage
    .from(BUCKET)
    .upload(`${ALERTS_PREFIX}/${key}.json`, body, { contentType: 'application/json', upsert: true });
  if (error) console.warn('[monitor] markAlerted failed (ignored):', error.message);
}

/** Clear markers for recovered conditions so the next failure alerts at once. */
export async function clearAlerts(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const { error } = await admin().storage
    .from(BUCKET)
    .remove(keys.map(k => `${ALERTS_PREFIX}/${k}.json`));
  if (error) console.warn('[monitor] clearAlerts failed (ignored):', error.message);
}
