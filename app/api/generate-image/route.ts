import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getGenerator } from '@/lib/ai/images';

// Replicate polling can run up to 55s on a cold model start — keep the Vercel
// function alive for the whole window (the default duration kills the poll).
export const maxDuration = 60;

const BUCKET = 'deck-images';

// Attempt bucket creation once per process lifetime; ignore if it already exists.
let bucketEnsured = false;
async function ensureBucket() {
  if (bucketEnsured) return;
  const admin = createAdminClient();
  await admin.storage.createBucket(BUCKET, { public: true }).catch(() => { /* already exists */ });
  bucketEnsured = true;
}

function getApiKey(provider: string): string | null {
  switch (provider) {
    case 'flux':   return process.env.REPLICATE_API_TOKEN ?? null;
    // TODO: case 'dalle':  return process.env.OPENAI_API_KEY       ?? null;
    // TODO: case 'imagen': return process.env.GOOGLE_AI_API_KEY    ?? null;
    default:       return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: { prompt?: unknown; provider?: unknown; aspectRatio?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const prompt   = typeof body.prompt   === 'string' ? body.prompt.trim()   : '';
    const provider = typeof body.provider === 'string' ? body.provider.trim() : 'flux';
    const VALID_ASPECTS = ['16:9', '3:4', '9:16', '1:1', '4:3'] as const;
    const aspectRatio = VALID_ASPECTS.find(a => a === body.aspectRatio) ?? '16:9';

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const apiKey = getApiKey(provider);
    if (!apiKey) {
      return NextResponse.json(
        { error: `API key not configured for provider "${provider}" — check server env vars` },
        { status: 500 },
      );
    }

    // Generate image — returns a temporary Replicate delivery URL
    const generate = getGenerator(provider);
    const replicateUrl = await generate(prompt, apiKey, { aspectRatio });

    // Download the image bytes from Replicate before the URL expires
    const imageRes = await fetch(replicateUrl);
    if (!imageRes.ok) {
      throw new Error(`Failed to download image from Replicate: HTTP ${imageRes.status}`);
    }
    const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

    // Upload to Supabase Storage and return the permanent public URL
    await ensureBucket();
    const admin = createAdminClient();
    const filePath = `${user.id}/${Date.now()}.webp`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(filePath, imageBuffer, { contentType: 'image/webp', upsert: false });

    if (uploadError) {
      throw new Error(`Supabase storage upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });

  } catch (err) {
    console.error('[generate-image] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Image generation failed' },
      { status: 500 },
    );
  }
}
