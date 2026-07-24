'use client';
import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { PageHeader, Card, Spinner, StatusBadge } from '@/components/ui';

export default function CasesPage() {
  const { data, loading } = useFetch<any>('/api/cases');
  const cases: any[] = data?.cases || [];

  return (
    <div>
      <PageHeader title="Casos clínicos" subtitle="Histórico de casos analisados. Cada caso guarda a entrada do médico, a resposta da IA e as fontes citadas (auditoria)."
        action={<Link href="/chat" className="btn-primary">✦ Novo no chat</Link>} />

      {loading ? <Spinner /> : !cases.length ? (
        <Card className="text-center text-slate-400 py-10">
          Nenhum caso ainda. <Link href="/chat" className="link">Abrir o chat clínico →</Link>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {cases.map((c: any) => (
            <Link key={c.id} href={`/cases/${c.id}`}>
              <Card className="h-full hover:border-brand transition">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-navy">{c.titulo || 'Caso clínico'}</h3>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {[c.idade && `${c.idade} anos`, c.sexo].filter(Boolean).join(' · ')}
                </div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{c.queixa_principal || c.objetivo_consulta || '—'}</p>
                <div className="text-[11px] text-slate-400 mt-2">{new Date(c.created_at).toLocaleString('pt-BR')}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
