'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useFetch, postJSON } from '@/hooks/useFetch';
import { PageHeader, Card, Spinner, StatusBadge } from '@/components/ui';

export default function DocumentsPage() {
  const [q, setQ] = useState('');
  const { data, loading, reload } = useFetch<any>('/api/documents');
  const [busyId, setBusyId] = useState<string | null>(null);
  const docs: any[] = (data?.documents || []).filter((d: any) =>
    !q || d.titulo?.toLowerCase().includes(q.toLowerCase()) || d.autor?.toLowerCase().includes(q.toLowerCase()),
  );

  async function extrair(id: string) {
    setBusyId(id);
    try {
      const r = await postJSON('/api/extract', { document_id: id });
      alert(`Extração disparada: ${r.extraidos ?? 0} item(ns). Veja em Revisão médica.`);
    } catch (e: any) { alert('Erro: ' + e.message); }
    finally { setBusyId(null); }
  }

  async function excluir(id: string, titulo: string) {
    if (!confirm(`Excluir "${titulo}" e todos os seus chunks/extrações? Esta ação não pode ser desfeita.`)) return;
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    reload();
  }

  return (
    <div>
      <PageHeader
        title="Documentos"
        subtitle="Acervo enviado. Cada documento é extraído, fatiado em chunks e vetorizado para o RAG."
        action={<Link href="/documents/upload" className="btn-primary">⬆ Enviar conteúdo</Link>}
      />

      <div className="mb-4 max-w-md">
        <input className="input" placeholder="Buscar por título ou autor…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? <Spinner /> : (
        <Card className="!p-0 overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead><tr className="bg-slate-50">
              <th className="th">Título</th><th className="th">Tipo</th><th className="th">Status</th>
              <th className="th">Chunks</th><th className="th">Enviado</th><th className="th text-right">Ações</th>
            </tr></thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="td">
                    <Link href={`/documents/${d.id}`} className="font-semibold text-navy hover:text-brand">{d.titulo}</Link>
                    <div className="text-slate-400 text-xs">{d.autor || '—'}{d.tema_principal ? ' · ' + d.tema_principal : ''}</div>
                  </td>
                  <td className="td uppercase text-xs text-slate-500">{d.tipo}</td>
                  <td className="td"><StatusBadge status={d.status} /></td>
                  <td className="td">{d.total_chunks}</td>
                  <td className="td text-xs text-slate-400">{new Date(d.created_at).toLocaleDateString('pt-BR')}</td>
                  <td className="td text-right whitespace-nowrap">
                    {d.status === 'indexado' && (
                      <button onClick={() => extrair(d.id)} disabled={busyId === d.id} className="btn-ghost btn-sm mr-1">
                        {busyId === d.id ? '…' : 'Extrair'}
                      </button>
                    )}
                    <button onClick={() => excluir(d.id, d.titulo)} className="btn-ghost btn-sm !text-rose-600">Excluir</button>
                  </td>
                </tr>
              ))}
              {!docs.length && (
                <tr><td colSpan={6} className="td text-center text-slate-400 py-10">
                  Nenhum documento. <Link href="/documents/upload" className="link">Envie o primeiro conteúdo →</Link>
                </td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
