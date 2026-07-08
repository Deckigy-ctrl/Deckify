import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_WORDS = 6000;

const DOC_TYPES: Record<string, 'pdf' | 'docx' | 'pptx'> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
};

function kindFromFile(file: File): 'pdf' | 'docx' | 'pptx' | null {
  const byMime = DOC_TYPES[file.type];
  if (byMime) return byMime;
  // Some browsers send empty/odd MIME types — fall back to the extension.
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'pptx') return 'pptx';
  return null;
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // pdf-parse must not be webpack-bundled (see next.config.mjs
  // serverExternalPackages) — dynamic import keeps the require at call time.
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  return result.text.trim();
}

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value.trim();
}

// A .pptx is a zip; visible text lives in <a:t> runs inside ppt/slides/slideN.xml.
async function extractPptx(buffer: Buffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter(p => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const n = (p: string) => parseInt(p.match(/slide(\d+)\.xml/)![1], 10);
      return n(a) - n(b);
    });
  const parts: string[] = [];
  for (const path of slidePaths) {
    const xml = await zip.files[path].async('string');
    const runs = Array.from(xml.matchAll(/<a:t>([^<]*)<\/a:t>/g), m => m[1]);
    if (runs.length) parts.push(runs.join(' '));
  }
  return parts.join('\n\n').trim();
}

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

    const kind = kindFromFile(file);
    if (!kind) {
      return NextResponse.json({ error: 'Only PDF, Word (.docx), and PowerPoint (.pptx) files are supported' }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'File is too large (max 10 MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let text: string;
    try {
      text = kind === 'pdf' ? await extractPdf(buffer)
           : kind === 'docx' ? await extractDocx(buffer)
           : await extractPptx(buffer);
    } catch {
      return NextResponse.json(
        { error: `Couldn't read this ${kind.toUpperCase()} file. It may be corrupted or password-protected.` },
        { status: 400 },
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: 'No readable text found in this file. Try pasting the text instead.' },
        { status: 400 },
      );
    }

    const words = text.split(/\s+/);
    const capped = words.length > MAX_WORDS ? words.slice(0, MAX_WORDS).join(' ') : text;

    console.log('[extract-doc]', kind, file.name, file.size, 'bytes →', words.length, 'words');

    return NextResponse.json({ text: capped });

  } catch (err) {
    console.error('[extract-doc] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Text extraction failed. Please try again or paste the text instead.' },
      { status: 500 },
    );
  }
}
