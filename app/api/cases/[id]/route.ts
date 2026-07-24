import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';

export const runtime = 'nodejs';

// Detalhe de um caso + suas mensagens (incl. respostas estruturadas).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  if (!hasSupabase()) return NextResponse.json({ configured: false });
  try {
    const db = supabaseAdmin();
    const [{ data: caso, error: e1 }, { data: messages, error: e2 }] = await Promise.all([
      db.from('clinical_cases').select('*').eq('id', params.id).single(),
      db.from('clinical_chat_messages').select('*').eq('case_id', params.id).order('created_at', { ascending: true }),
    ]);
    if (e1) return NextResponse.json({ error: e1.message }, { status: 404 });
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    return NextResponse.json({ configured: true, case: caso, messages: messages || [] });
  } catch (e: any) {
    return NextResponse.json({ error: String(e.message || e) }, { status: 500 });
  }
}
