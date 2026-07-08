import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Server persistence for presentations, keyed to the account like credits.
// Decks are stored as one JSON blob per user in a PRIVATE storage bucket
// (deck-data/{userId}/decks.json), read and written only through this route.
// Storage was chosen over a `decks` table because bucket creation works with
// the service-role key we already have, while CREATE TABLE needs dashboard
// access; the client is transport-agnostic so the internals can move to a
// table later without app changes.

// GET reads auth cookies, so this route can never be statically prerendered.
export const dynamic = 'force-dynamic';

const BUCKET = 'deck-data';
const FILE = 'decks.json';
const MAX_BYTES = 4 * 1024 * 1024; // decks are URLs + text; 4 MB is generous

let bucketEnsured = false;
async function ensureBucket() {
  if (bucketEnsured) return;
  const admin = createAdminClient();
  // Private bucket: no public URLs — deck data is only served via this route.
  const { error } = await admin.storage.createBucket(BUCKET, { public: false });
  if (error && !`${error.message}`.toLowerCase().includes('already exists')) {
    throw new Error(`Bucket creation failed: ${error.message}`);
  }
  bucketEnsured = true;
}

async function getUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function GET() {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await ensureBucket();
    const admin = createAdminClient();
    const { data, error } = await admin.storage.from(BUCKET).download(`${userId}/${FILE}`);
    if (error) {
      // No file yet = a user who has never synced. That's an empty list, not
      // an error — the client migrates its local decks up on seeing [].
      return NextResponse.json({ userId, decks: [] });
    }
    const text = await data.text();
    const parsed = JSON.parse(text) as unknown;
    return NextResponse.json({ userId, decks: Array.isArray(parsed) ? parsed : [] });
  } catch (err) {
    console.error('[decks] GET error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to load decks' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.text();
    if (body.length > MAX_BYTES) {
      return NextResponse.json({ error: 'Deck data too large' }, { status: 413 });
    }
    let decks: unknown;
    try {
      decks = (JSON.parse(body) as { decks?: unknown }).decks;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    if (!Array.isArray(decks)) {
      return NextResponse.json({ error: 'decks must be an array' }, { status: 400 });
    }

    await ensureBucket();
    const admin = createAdminClient();
    const blob = Buffer.from(JSON.stringify(decks), 'utf-8');
    const { error } = await admin.storage
      .from(BUCKET)
      .upload(`${userId}/${FILE}`, blob, { contentType: 'application/json', upsert: true });
    if (error) throw new Error(`Storage write failed: ${error.message}`);

    return NextResponse.json({ ok: true, count: decks.length });
  } catch (err) {
    console.error('[decks] PUT error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to save decks' }, { status: 500 });
  }
}
