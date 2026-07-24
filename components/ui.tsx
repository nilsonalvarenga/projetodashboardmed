// Primitivos de UI reutilizáveis (apresentação). Importados por páginas client.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { CATEGORY_LABEL, type ClinicalCategory } from '@/lib/categories';

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function StatCard({ label, value, hint, href, accent }: {
  label: string; value: ReactNode; hint?: string; href?: string; accent?: boolean;
}) {
  const inner = (
    <div className={`card p-5 h-full transition ${href ? 'hover:border-brand hover:shadow-md' : ''}`}>
      <div className="section-title">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${accent ? 'text-brand' : 'text-navy'}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
  return href ? <Link href={href} className="block">{inner}</Link> : inner;
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card p-10 text-center">
      <p className="text-slate-600 font-semibold">{title}</p>
      {hint && <p className="text-sm text-slate-400 mt-1">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Spinner({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 text-sm py-8 justify-center">
      <span className="inline-block w-4 h-4 rounded-full border-2 border-slate-300 border-t-brand animate-spin" />
      {label}
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pendente: 'bg-amber-100 text-amber-700',
  revisado: 'bg-sky-100 text-sky-700',
  aprovado: 'bg-emerald-100 text-emerald-700',
  rejeitado: 'bg-rose-100 text-rose-700',
  precisa_corrigir: 'bg-orange-100 text-orange-700',
  // documentos
  recebido: 'bg-slate-100 text-slate-600',
  processando: 'bg-sky-100 text-sky-700',
  indexado: 'bg-emerald-100 text-emerald-700',
  erro: 'bg-rose-100 text-rose-700',
  arquivado: 'bg-slate-100 text-slate-500',
  // casos
  aberto: 'bg-sky-100 text-sky-700',
  em_analise: 'bg-amber-100 text-amber-700',
  concluido: 'bg-emerald-100 text-emerald-700',
};
const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente', revisado: 'Revisado', aprovado: 'Aprovado',
  rejeitado: 'Rejeitado', precisa_corrigir: 'Corrigir', recebido: 'Recebido',
  processando: 'Processando', indexado: 'Indexado', erro: 'Erro', arquivado: 'Arquivado',
  aberto: 'Aberto', em_analise: 'Em análise', concluido: 'Concluído',
};
export function StatusBadge({ status }: { status?: string | null }) {
  if (!status) return null;
  return <span className={`badge ${STATUS_STYLE[status] || 'bg-slate-100 text-slate-600'}`}>{STATUS_LABEL[status] || status}</span>;
}

export function CategoryBadge({ category }: { category?: string | null }) {
  if (!category) return null;
  return <span className="chip">{CATEGORY_LABEL[category as ClinicalCategory] || category}</span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  );
}

// Renderiza um par rótulo/valor (oculta se vazio) — usado nos cards de extração.
export function KV({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null;
  return (
    <div className="text-sm">
      <span className="font-semibold text-navy">{k}: </span>
      <span className="text-slate-600 whitespace-pre-wrap">{v}</span>
    </div>
  );
}
