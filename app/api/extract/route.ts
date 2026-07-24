import { NextRequest, NextResponse } from 'next/server';
import { extractStructured } from '@/lib/extractStructured';
import { hasSupabase, hasLLM } from '@/lib/env';
import { requireCapability } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 300;

// Dispara a extração estruturada (IA) de um documento já indexado.
export async function POST(req: NextRequest) {
  if (!hasSupabase() || !hasLLM()) {
    return NextResponse.json(
      { error: 'Configure Supabase e o LLM (OpenAI/Claude) em .env.local antes de extrair.' },
      { status: 503 },
    );
  }
  const auth = await requireCapability('ingest');
  if (auth instanceof NextResponse) return auth;
  try {
    const { document_id } = await req.json();
    if (!document_id) return NextResponse.json({ error: 'document_id ausente' }, { status: 400 });
    const r = await extractStructured(document_id);
    return NextResponse.json({ ok: true, ...r });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
