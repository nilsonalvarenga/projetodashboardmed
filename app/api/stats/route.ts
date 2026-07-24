import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { hasSupabase } from '@/lib/env';

export const runtime = 'nodejs';

async function count(db: any, table: string, filter?: [string, any]): Promise<number> {
  let q = db.from(table).select('*', { count: 'exact', head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count } = await q;
  return count || 0;
}

const EMPTY = {
  configured: false,
  documents: 0, chunks: 0, meds: 0, supps: 0, protos: 0, conducts: 0,
  pendChunks: 0, pendExtr: 0, cases: 0, alerts: 0, recentes: [] as any[],
};

export async function GET() {
  if (!hasSupabase()) return NextResponse.json(EMPTY);
  try {
    const db = supabaseAdmin();
    const [documents, chunks, meds, supps, protos, conducts, pendChunks, pendExtr, cases, alerts] =
      await Promise.all([
        count(db, 'documents'),
        count(db, 'document_chunks'),
        count(db, 'extracted_medications'),
        count(db, 'extracted_supplements'),
        count(db, 'extracted_protocols'),
        count(db, 'extracted_conducts'),
        count(db, 'document_chunks', ['status', 'pendente']),
        count(db, 'extracted_medications', ['status', 'pendente']),
        count(db, 'clinical_cases'),
        count(db, 'review_queue', ['status', 'pendente']),
      ]);
    const { data: recentes } = await db
      .from('clinical_cases')
      .select('id,titulo,queixa_principal,created_at')
      .order('created_at', { ascending: false })
      .limit(6);
    return NextResponse.json({
      configured: true,
      documents, chunks, meds, supps, protos, conducts,
      pendChunks, pendExtr, cases, alerts, recentes: recentes || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ...EMPTY, error: String(e.message || e) });
  }
}
