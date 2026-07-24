'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useFetch, postJSON } from '@/hooks/useFetch';
import { PageHeader, Card, Spinner, StatusBadge, CategoryBadge, Empty } from '@/components/ui';

export default function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data, loading } = useFetch<any>(`/api/documents/${id}`);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (!data?.document) return <Empty title="Documento não encontrado" action={<Link href="/documents" className="btn-ghost">← Voltar</Link>} />;

  const d = data.document;
  const ex = data.extractions || {};

  async function extrair() {
    setBusy(true);
    try {
      const r = await postJSON('/api/extract', { document_id: id });
      alert(`Extração disparada: ${r.extraidos ?? 0} item(ns). Veja em Revisão médica.`);
    } catch (e: any) { alert('Erro: ' + e.message); }
    finally { setBusy(false); }
  }

  const meta: [string, any][] = [
    ['Autor/Professor', d.autor], ['Curso/Origem', d.curso_origem], ['Módulo/Aula', d.modulo_aula],
    ['Tema principal', d.tema_principal], ['Tipo', d.tipo], ['Data do conteúdo', d.data_conteudo],
  ];

  return (
    <div>
      <PageHeader
        title={d.titulo}
        subtitle={d.observacoes || undefined}
        action={
          <div className="flex gap-2">
            <Link href="/documents" className="btn-ghost">← Voltar</Link>
            {d.status === 'indexado' && <button onClick={extrair} disabled={busy} className="btn-primary">{busy ? '…' : 'Extrair estruturado'}</button>}
          </div>
        }
      />

      {d.status === 'erro' && d.erro_msg && (
        <div className="mb-4 text-sm bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2">Erro na ingestão: {d.erro_msg}</div>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <div className="section-title mb-2">Metadados</div>
          <div className="flex items-center gap-2 mb-3"><StatusBadge status={d.status} /><span className="text-sm text-slate-500">{d.total_chunks} chunks</span></div>
          <dl className="space-y-1.5 text-sm">
            {meta.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex gap-2"><dt className="text-slate-400 w-32 shrink-0">{k}</dt><dd className="text-navy">{String(v)}</dd></div>
            ))}
          </dl>
          {d.tags?.length > 0 && <div className="mt-3 flex flex-wrap gap-1">{d.tags.map((t: string) => <span key={t} className="chip">#{t}</span>)}</div>}
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            {[['Medic.', ex.medications], ['Suplem.', ex.supplements], ['Condutas', ex.conducts], ['Protoc.', ex.protocols]].map(([l, v]) => (
              <div key={l as string} className="bg-slate-50 rounded-lg py-2"><div className="text-lg font-bold text-navy">{v ?? 0}</div><div className="text-[11px] text-slate-400">{l}</div></div>
            ))}
          </div>
        </Card>

        <div className="lg:col-span-2">
          <div className="section-title mb-2">Trechos indexados (amostra · {data.chunks?.length || 0})</div>
          {data.chunks?.length ? (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {data.chunks.map((c: any) => (
                <Card key={c.id} className="!p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] text-slate-400">#{c.chunk_index}{c.pagina ? ` · p.${c.pagina}` : ''}</span>
                    <CategoryBadge category={c.category} />
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4">{c.content}</p>
                </Card>
              ))}
            </div>
          ) : <Card className="text-slate-400 text-sm">Sem chunks indexados ainda.</Card>}
        </div>
      </div>
    </div>
  );
}
