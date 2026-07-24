'use client';
import type { ReactNode } from 'react';

// Renderiza a resposta clínica estruturada (12 seções) com as 4 separações explícitas:
// base (com [n]) · raciocínio inferido · confirmações pendentes · alertas de segurança.

export interface Source {
  n: number; titulo: string; autor?: string | null; pagina?: number | null;
  category?: string; similarity?: number; document_id?: string; chunk_id?: string; content?: string;
}

function Sec({ n, t, children, danger }: { n: number; t: string; children: ReactNode; danger?: boolean }) {
  return (
    <section className="mb-4">
      <h3 className={`font-bold text-xs uppercase tracking-wide mb-1.5 ${danger ? 'text-rose-700' : 'text-navy'}`}>
        <span className="text-slate-300 mr-1">{n}.</span>{t}
      </h3>
      <div className="text-sm text-slate-700 space-y-1">{children}</div>
    </section>
  );
}

const cites = (f?: number[]) =>
  f?.length ? <sup className="text-brand font-bold"> [{f.join(',')}]</sup> : null;

const OriginBadge = ({ origem }: { origem?: string }) => (
  <span className={`badge mr-1.5 ${origem === 'base' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
    {origem === 'base' ? 'base' : 'inferido'}
  </span>
);

export default function ClinicalAnswer({ a, sources }: { a: any; sources?: Source[] }) {
  if (!a) return null;
  const arr = (x: any): any[] => (Array.isArray(x) ? x : []);
  return (
    <div className="card p-5">
      <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg px-3 py-2 mb-4">
        ⚠️ {a.aviso || 'Apoio à decisão. A decisão final é sempre do médico.'}
      </div>

      <Sec n={1} t="Resumo do caso"><p className="whitespace-pre-wrap">{a.resumo_caso || '—'}</p></Sec>

      <Sec n={2} t="Problemas clínicos principais">
        {arr(a.problemas_principais).length
          ? <ul className="list-disc pl-5">{arr(a.problemas_principais).map((x, i) => <li key={i}>{x}</li>)}</ul>
          : <p className="text-slate-400">—</p>}
      </Sec>

      <Sec n={3} t="Raciocínio clínico (marca o que é inferido)">
        <p className="whitespace-pre-wrap">{a.raciocinio_clinico || '—'}</p>
      </Sec>

      <Sec n={4} t="Informações encontradas na base (com citação)">
        {arr(a.informacoes_da_base).length
          ? <ul className="list-disc pl-5">{arr(a.informacoes_da_base).map((x, i) => <li key={i}>{x.texto}{cites(x.fontes)}</li>)}</ul>
          : <p className="text-slate-400">Nada relevante encontrado na base do médico.</p>}
      </Sec>

      <Sec n={5} t="Conduta sugerida (base/inferido)">
        {arr(a.conduta_sugerida).length
          ? arr(a.conduta_sugerida).map((x, i) => <p key={i}><OriginBadge origem={x.origem} />{x.texto}{cites(x.fontes)}</p>)
          : <p className="text-slate-400">—</p>}
      </Sec>

      <Sec n={6} t="Exames que podem ser considerados">
        {arr(a.exames_considerar).length
          ? arr(a.exames_considerar).map((x, i) => <p key={i}><OriginBadge origem={x.origem} />{x.texto}{cites(x.fontes)}</p>)
          : <p className="text-slate-400">—</p>}
      </Sec>

      <Sec n={7} t="Medicações/suplementos citados na base">
        {arr(a.medicacoes_suplementos).length
          ? arr(a.medicacoes_suplementos).map((x, i) => <p key={i}><b>{x.nome}</b>{x.detalhe ? ` — ${x.detalhe}` : ''}{cites(x.fontes)}</p>)
          : <p className="text-slate-400">—</p>}
      </Sec>

      <Sec n={8} t="Contraindicações e alertas de segurança" danger>
        {arr(a.contraindicacoes_alertas).length
          ? <ul className="list-disc pl-5 text-rose-700">{arr(a.contraindicacoes_alertas).map((x, i) => <li key={i}>{x}</li>)}</ul>
          : <p className="text-slate-400">Nenhum alerta específico sinalizado — confirme manualmente os riscos.</p>}
      </Sec>

      <Sec n={9} t="Perguntas que faltam para fechar o caso">
        {arr(a.perguntas_para_fechar).length
          ? <ul className="list-disc pl-5">{arr(a.perguntas_para_fechar).map((x, i) => <li key={i}>{x}</li>)}</ul>
          : <p className="text-slate-400">—</p>}
      </Sec>

      <Sec n={10} t="Plano de acompanhamento">
        {arr(a.plano_acompanhamento).length
          ? <ul className="list-disc pl-5">{arr(a.plano_acompanhamento).map((x, i) => <li key={i}>{x}</li>)}</ul>
          : <p className="text-slate-400">—</p>}
      </Sec>

      <Sec n={11} t="Fontes internas usadas">
        {sources && sources.length
          ? <ol className="space-y-1">{sources.map((s) => (
              <li key={s.n} className="text-xs">
                <b className="text-brand">[{s.n}]</b> {s.titulo}{s.autor ? ` — ${s.autor}` : ''}{s.pagina ? `, p.${s.pagina}` : ''}{' '}
                <span className="text-slate-400">({s.category}{typeof s.similarity === 'number' ? `, ${Math.round(s.similarity * 100)}%` : ''})</span>
              </li>
            ))}</ol>
          : <p className="text-slate-400">Nenhuma fonte recuperada da base.</p>}
      </Sec>

      <Sec n={12} t="Aviso">
        <p className="text-slate-600">{a.aviso || 'Este conteúdo é apoio à decisão. A decisão final, a prescrição e a responsabilidade são sempre do médico.'}</p>
      </Sec>
    </div>
  );
}
