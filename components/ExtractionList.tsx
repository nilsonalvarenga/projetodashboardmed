'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { PageHeader, Card, Spinner, StatusBadge, KV } from '@/components/ui';

type Kind = 'medication' | 'supplement' | 'conduct' | 'protocol';

const TITLE_COL: Record<Kind, string> = {
  medication: 'nome', supplement: 'nome', conduct: 'problema_clinico', protocol: 'titulo',
};
const FIELDS: Record<Kind, string[]> = {
  medication: ['classe', 'dose_citada', 'frequencia', 'indicacao', 'contraindicacoes', 'efeitos_adversos', 'interacoes', 'observacoes'],
  supplement: ['dose', 'forma', 'indicacao', 'sinais_deficiencia', 'riscos', 'interacoes', 'exames_relacionados', 'observacoes'],
  conduct: ['criterios_inclusao', 'criterios_exclusao', 'passo_a_passo', 'exames_antes', 'exames_seguimento', 'medicacoes_associadas', 'suplementacao_associada', 'dieta_estilo_vida', 'alertas'],
  protocol: ['objetivo', 'publico_alvo', 'avaliacao_inicial', 'exames', 'intervencao', 'acompanhamento', 'criterios_parada', 'riscos'],
};
const STATUSES = ['', 'aprovado', 'pendente', 'revisado', 'precisa_corrigir', 'rejeitado'];

export default function ExtractionList({ kind, title, subtitle }: { kind: Kind; title: string; subtitle: string }) {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const url = `/api/extractions?kind=${kind}${status ? `&status=${status}` : ''}`;
  const { data, loading } = useFetch<any>(url);

  const items: any[] = useMemo(() => {
    const list = data?.items || [];
    if (!q) return list;
    const t = TITLE_COL[kind];
    return list.filter((it: any) => (it[t] || '').toLowerCase().includes(q.toLowerCase()));
  }, [data, q, kind]);

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}
        action={<Link href="/review" className="btn-ghost">✅ Fila de revisão</Link>} />

      <div className="flex flex-wrap gap-2 mb-4">
        <input className="input max-w-xs" placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[200px]" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s ? `Status: ${s}` : 'Todos os status'}</option>)}
        </select>
      </div>

      {loading ? <Spinner /> : !items.length ? (
        <Card className="text-center text-slate-400 py-10">
          Nenhuma extração encontrada. Extrações são geradas em <b>Documentos → Extrair</b> e aprovadas em <b>Revisão</b>.
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map((it: any) => (
            <Card key={it.id}>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-navy">{it[TITLE_COL[kind]] || '—'}</h3>
                <StatusBadge status={it.status} />
              </div>
              <div className="mt-2 space-y-1">
                {FIELDS[kind].map((f) => <KV key={f} k={f} v={it[f]} />)}
              </div>
              {it.documents?.titulo && (
                <div className="mt-2 text-[11px] text-slate-400">📄 {it.documents.titulo}{it.documents.autor ? ` — ${it.documents.autor}` : ''}</div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
