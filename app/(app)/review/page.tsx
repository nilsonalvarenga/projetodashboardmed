'use client';
import { useState } from 'react';
import { useFetch, postJSON } from '@/hooks/useFetch';
import { PageHeader, Card, Spinner, KV } from '@/components/ui';

type Kind = 'medication' | 'supplement' | 'conduct' | 'protocol';

const TITLE_COL: Record<Kind, string> = {
  medication: 'nome', supplement: 'nome', conduct: 'problema_clinico', protocol: 'titulo',
};
// Campos exibidos (e editáveis) por tipo.
const FIELDS: Record<Kind, string[]> = {
  medication: ['nome', 'classe', 'dose_citada', 'frequencia', 'indicacao', 'contraindicacoes', 'efeitos_adversos', 'interacoes', 'observacoes'],
  supplement: ['nome', 'dose', 'forma', 'indicacao', 'sinais_deficiencia', 'riscos', 'interacoes', 'exames_relacionados', 'observacoes'],
  conduct: ['problema_clinico', 'criterios_inclusao', 'criterios_exclusao', 'passo_a_passo', 'exames_antes', 'exames_seguimento', 'medicacoes_associadas', 'suplementacao_associada', 'dieta_estilo_vida', 'alertas'],
  protocol: ['titulo', 'objetivo', 'publico_alvo', 'avaliacao_inicial', 'exames', 'intervencao', 'acompanhamento', 'criterios_parada', 'riscos'],
};

export default function ReviewPage() {
  const { data, loading, reload } = useFetch<any>('/api/review');
  const groups: [Kind, string, any[]][] = [
    ['medication', 'Medicações', data?.medications || []],
    ['supplement', 'Vitaminas/Suplementos', data?.supplements || []],
    ['conduct', 'Condutas', data?.conducts || []],
    ['protocol', 'Protocolos', data?.protocols || []],
  ];
  const total = groups.reduce((s, g) => s + g[2].length, 0);

  return (
    <div>
      <PageHeader
        title="Revisão médica"
        subtitle="Toda extração nasce pendente. Edite se necessário e então aprove, marque para corrigir ou rejeite. Protocolo aprovado vira oficial."
      />
      {loading ? <Spinner /> : total === 0 ? (
        <Card className="text-center text-slate-400 py-10">Nenhuma extração pendente de revisão. 🎉</Card>
      ) : (
        groups.map(([kind, label, items]) => items.length > 0 && (
          <section key={kind} className="mb-8">
            <h2 className="font-bold text-navy mb-3">{label} <span className="text-slate-400 text-sm font-normal">({items.length})</span></h2>
            <div className="space-y-3">
              {items.map((it: any) => <ReviewCard key={it.id} kind={kind} item={it} onDone={reload} />)}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function ReviewCard({ kind, item, onDone }: { kind: Kind; item: any; onDone: () => void }) {
  const [editing, setEditing] = useState(false);
  const [patch, setPatch] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const title = item[TITLE_COL[kind]] || '—';

  async function act(status: string) {
    setBusy(true);
    try {
      await postJSON('/api/review', { entity_type: kind, id: item.id, status, patch: editing ? patch : undefined });
      onDone();
    } catch (e: any) { alert('Erro: ' + e.message); setBusy(false); }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-bold text-navy">{title}</div>
          {item.confianca != null && <div className="text-[11px] text-slate-400">confiança IA: {Math.round(item.confianca * 100)}%</div>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={() => setEditing((v) => !v)} className="btn-ghost btn-sm">{editing ? 'Cancelar edição' : 'Editar'}</button>
          <button onClick={() => act('aprovado')} disabled={busy} className="btn-sm btn bg-emerald-600 text-white hover:bg-emerald-700">Aprovar</button>
          <button onClick={() => act('precisa_corrigir')} disabled={busy} className="btn-ghost btn-sm !text-amber-700">Corrigir</button>
          <button onClick={() => act('rejeitado')} disabled={busy} className="btn-danger btn-sm">Rejeitar</button>
        </div>
      </div>

      <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1">
        {FIELDS[kind].map((f) =>
          editing ? (
            <label key={f} className="block text-sm">
              <span className="text-[11px] font-semibold text-slate-500">{f}</span>
              <textarea className="textarea !min-h-[44px] text-xs" defaultValue={item[f] || ''}
                onChange={(e) => setPatch((p) => ({ ...p, [f]: e.target.value }))} />
            </label>
          ) : <KV key={f} k={f} v={item[f]} />,
        )}
      </div>

      {item.fonte_trecho && (
        <div className="mt-3 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          <b>Fonte (trecho):</b> “{String(item.fonte_trecho).slice(0, 240)}”
          {item.documents?.titulo && <span className="block text-slate-400 mt-0.5">📄 {item.documents.titulo}{item.documents.autor ? ` — ${item.documents.autor}` : ''}</span>}
        </div>
      )}
    </Card>
  );
}
