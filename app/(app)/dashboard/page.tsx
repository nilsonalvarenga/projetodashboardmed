'use client';
import Link from 'next/link';
import { useFetch } from '@/hooks/useFetch';
import { PageHeader, StatCard, Card, Spinner, Empty } from '@/components/ui';

export default function DashboardPage() {
  const { data, loading } = useFetch<any>('/api/stats');

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral do acervo indexado, das extrações estruturadas e dos casos clínicos. Apoio à decisão — a decisão final é sempre do médico."
        action={<Link href="/chat" className="btn-primary">✦ Novo caso clínico</Link>}
      />

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard label="Documentos" value={data?.documents ?? 0} href="/documents" accent />
            <StatCard label="Chunks indexados" value={data?.chunks ?? 0} hint="trechos vetorizados" />
            <StatCard label="Medicações" value={data?.meds ?? 0} href="/medications" />
            <StatCard label="Vitaminas/Suplem." value={data?.supps ?? 0} href="/supplements" />
            <StatCard label="Protocolos" value={data?.protos ?? 0} href="/protocols" />
            <StatCard label="Condutas" value={data?.conducts ?? 0} href="/conducts" />
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-navy">Últimos casos clínicos</h2>
                  <Link href="/cases" className="link text-sm">ver todos</Link>
                </div>
                {data?.recentes?.length ? (
                  <ul className="divide-y divide-slate-100">
                    {data.recentes.map((c: any) => (
                      <li key={c.id} className="py-2.5">
                        <Link href={`/cases/${c.id}`} className="block hover:bg-slate-50 -mx-2 px-2 rounded">
                          <div className="font-semibold text-navy text-sm">{c.titulo || 'Caso clínico'}</div>
                          <div className="text-xs text-slate-500 truncate">{c.queixa_principal}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{new Date(c.created_at).toLocaleString('pt-BR')}</div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 py-4">Nenhum caso analisado ainda.</p>
                )}
              </Card>
            </div>

            <div className="space-y-4">
              <Card className="bg-amber-50 border-amber-200">
                <div className="section-title text-amber-700">Revisão pendente</div>
                <div className="mt-1 text-3xl font-bold text-amber-700">
                  {(data?.pendChunks ?? 0) + (data?.pendExtr ?? 0)}
                </div>
                <p className="text-xs text-amber-700/80 mt-1">
                  {data?.pendChunks ?? 0} trechos · {data?.pendExtr ?? 0} extrações aguardando aprovação
                </p>
                <Link href="/review" className="btn-ghost btn-sm mt-3">Abrir fila de revisão</Link>
              </Card>

              <Card>
                <div className="section-title">Atalhos</div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link href="/documents/upload" className="btn-ghost btn-sm">⬆ Enviar</Link>
                  <Link href="/knowledge" className="btn-ghost btn-sm">🔎 Buscar</Link>
                  <Link href="/cases/new" className="btn-ghost btn-sm">📝 Caso</Link>
                  <Link href="/settings" className="btn-ghost btn-sm">⚙ Config</Link>
                </div>
              </Card>
            </div>
          </div>

          {data && data.configured === false && (
            <div className="mt-4">
              <Empty
                title="Banco ainda não configurado"
                hint="Os números acima ficam em zero até você conectar o Supabase. Veja Configurações para o passo a passo."
                action={<Link href="/settings" className="btn-primary">Ir para Configurações</Link>}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
