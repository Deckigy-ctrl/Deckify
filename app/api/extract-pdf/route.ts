import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_WORDS = 6000;

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

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File is too large (max 10 MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // pdf-parse and pdfjs-dist must not be webpack-bundled (see next.config.mjs
    // serverExternalPackages). Dynamic import keeps the require at call time so
    // the Node.js native loader handles it, not webpack's RSC bundler.
    const { PDFParse } = await import('pdf-parse');

    let text: string;
    try {
      const parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      text = result.text.trim();
    } catch {
      // Separate from the empty-text case: a throw means the PDF is unreadable.
      return NextResponse.json(
        { error: "Couldn't read this PDF. It may be corrupted or password-protected." },
        { status: 400 },
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: 'This PDF has no readable text. Try pasting the text instead.' },
        { status: 400 },
      );
    }

    // Cap at MAX_WORDS to keep model context manageable.
    const words = text.split(/\s+/);
    const capped = words.length > MAX_WORDS ? words.slice(0, MAX_WORDS).join(' ') : text;

    console.log('[extract-pdf]', file.name, file.size, 'bytes →', words.length, 'words extracted');

    return NextResponse.json({ text: capped });

  } catch (err) {
    // Outer catch: ensures the route always returns JSON, never an HTML 500 page.
    console.error('[extract-pdf] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'PDF extraction failed. Please try again or paste the text instead.' },
      { status: 500 },
    );
  }
}
