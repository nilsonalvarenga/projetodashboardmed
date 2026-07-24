'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Upload() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg('Processando: extração de texto + chunking + embeddings…');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: fd });
      const j = await res.json();
      if (j.ok) {
        setMsg(`Indexado com sucesso: ${j.chunks} chunks.`);
        setTimeout(() => router.push('/documents'), 900);
      } else setMsg('Erro: ' + (j.error || 'falha na ingestão'));
    } catch (e: any) {
      setMsg('Erro: ' + String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  const TIPOS = ['pdf', 'docx', 'txt', 'markdown', 'csv', 'xlsx', 'transcricao', 'anotacao', 'outro'];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-navy mb-1">Enviar conteúdo</h1>
      <p className="text-slate-500 mb-6">PDF, DOCX, TXT, Markdown, CSV, XLSX, transcrição ou anotação clínica.</p>
      <form onSubmit={onSubmit} className="card p-6 space-y-4">
        <div><label className="label">Arquivo *</label><input className="input" type="file" name="file" required accept=".pdf,.docx,.txt,.md,.markdown,.csv,.xlsx,.xls" /></div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="label">Título</label><input className="input" name="titulo" placeholder="(usa o nome do arquivo se vazio)" /></div>
          <div><label className="label">Autor/Professor</label><input className="input" name="autor" /></div>
          <div><label className="label">Curso/Origem</label><input className="input" name="curso_origem" /></div>
          <div><label className="label">Módulo/Aula</label><input className="input" name="modulo_aula" /></div>
          <div><label className="label">Tema principal</label><input className="input" name="tema_principal" /></div>
          <div><label className="label">Tipo</label>
            <select className="input" name="tipo" defaultValue="pdf">{TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          </div>
          <div><label className="label">Data do conteúdo</label><input className="input" type="date" name="data_conteudo" /></div>
          <div><label className="label">Tags (separe por vírgula)</label><input className="input" name="tags" /></div>
        </div>
        <div><label className="label">Observações</label><textarea className="input" name="observacoes" rows={2} /></div>
        <div className="flex items-center gap-3">
          <button className="btn-primary" disabled={busy}>{busy ? 'Enviando…' : 'Enviar e indexar'}</button>
          {msg && <span className="text-sm text-slate-600">{msg}</span>}
        </div>
      </form>
    </div>
  );
}
