import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'deck-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
};

// Stores a user-uploaded image in the same public bucket the AI images use,
// so slides and the leftover tray only ever hold permanent URLs — never
// blob: URLs that die with the browser session. The '/uploads/' path segment
// is how the rest of the app recognises user uploads (vs AI images).
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const file = formData.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const ext = IMAGE_TYPES[file.type];
    if (!ext) {
      return NextResponse.json({ error: 'Only JPEG and PNG images are supported' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image is too large (max 5 MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const admin = createAdminClient();
    const filePath = `${user.id}/uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(filePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(filePath);
    return NextResponse.json({ url: publicUrl });

  } catch (err) {
    console.error('[upload-image] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    );
  }
}
