'use client';
import { useState } from 'react';
import { PageHeader, Card, Spinner, CategoryBadge } from '@/components/ui';
import { CLINICAL_CATEGORIES, CATEGORY_LABEL } from '@/lib/categories';

export default function KnowledgePage() {
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'both' | 'semantic' | 'keyword'>('both');
  const [cats, setCats] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState('');

  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setBusy(true); setErr(''); setRes(null);
    try {
      const r = await fetch('/api/search', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ q, mode, categories: cats }),
      });
      const j = await r.json();
      if (!r.ok || j.error) setErr(j.error || `Erro ${r.status}`); else setRes(j);
    } catch (e: any) { setErr(String(e.message || e)); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Busca na base" subtitle="Busque por palavra-chave (texto) e/ou por similaridade semântica (vetorial). Filtre por categoria clínica." />

      <form onSubmit={search} className="card p-4 space-y-3 mb-5">
        <div className="flex flex-wrap gap-2">
          <input className="input flex-1 min-w-[240px]" placeholder="Ex.: hipotireoide subclínico, dose de vitamina D, metformina…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input max-w-[180px]" value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="both">Semântica + texto</option>
            <option value="semantic">Só semântica</option>
            <option value="keyword">Só palavra-chave</option>
          </select>
          <button className="btn-primary" disabled={busy}>{busy ? '…' : 'Buscar'}</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CLINICAL_CATEGORIES.map((c) => {
            const on = cats.includes(c);
            return <button type="button" key={c} onClick={() => setCats((p) => on ? p.filter((x) => x !== c) : [...p, c])} className={`chip ${on ? '!bg-brand !text-white' : ''}`}>{CATEGORY_LABEL[c]}</button>;
          })}
        </div>
      </form>

      {err && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mb-4">{err}</p>}
      {busy && <Spinner label="Buscando no acervo…" />}

      {res && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div>
            <h2 className="font-bold text-navy mb-2">Similaridade semântica {res.semanticAvailable === false && <span className="text-xs text-amber-600 font-normal">(indisponível — configure OpenAI)</span>}</h2>
            <ResultList items={res.semantic} scoreKey="similarity" />
          </div>
          <div>
            <h2 className="font-bold text-navy mb-2">Palavra-chave</h2>
            <ResultList items={res.keyword} />
          </div>
        </div>
      )}
    </div>
  );
}

function ResultList({ items, scoreKey }: { items: any[]; scoreKey?: string }) {
  if (!items?.length) return <Card className="text-slate-400 text-sm">Nenhum resultado.</Card>;
  return (
    <div className="space-y-2">
      {items.map((r: any, i: number) => (
        <Card key={r.chunk_id || i} className="!p-3">
          <div className="flex items-center gap-2 mb-1">
            <CategoryBadge category={r.category} />
            {scoreKey && typeof r[scoreKey] === 'number' && <span className="chip">{Math.round(r[scoreKey] * 100)}%</span>}
            <span className="text-xs text-slate-400 truncate">{r.titulo}{r.autor ? ` — ${r.autor}` : ''}{r.pagina ? `, p.${r.pagina}` : ''}</span>
          </div>
          <p className="text-sm text-slate-600 line-clamp-4 whitespace-pre-wrap">{r.content}</p>
        </Card>
      ))}
    </div>
  );
}
