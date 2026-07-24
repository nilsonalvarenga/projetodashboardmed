'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useFetch, postJSON } from '@/hooks/useFetch';
import { PageHeader, Card, Spinner, Empty, StatusBadge } from '@/components/ui';
import ClinicalAnswer from '@/components/ClinicalAnswer';

const FIELD_LABEL: Record<string, string> = {
  idade: 'Idade', sexo: 'Sexo', peso_kg: 'Peso (kg)', altura_m: 'Altura (m)', imc: 'IMC',
  queixa_principal: 'Queixa principal', historia_clinica: 'História clínica', doencas_previas: 'Doenças prévias',
  medicacoes_uso: 'Medicações em uso', alergias: 'Alergias', exames_lab: 'Exames laboratoriais',
  exames_imagem: 'Exames de imagem', objetivo_consulta: 'Objetivo da consulta',
  restricoes_paciente: 'Restrições', observacoes_medico: 'Observações do médico',
};

export default function CaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, loading, reload } = useFetch<any>(`/api/cases/${id}`);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner />;
  if (!data?.case) return <Empty title="Caso não encontrado" action={<Link href="/cases" className="btn-ghost">← Voltar</Link>} />;

  const c = data.case;
  const messages: any[] = data.messages || [];

  async function analisar() {
    setBusy(true);
    try { await postJSON('/api/chat', { case_id: id, caso: c }); reload(); }
    catch (e: any) { alert('Erro: ' + e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader
        title={c.titulo || 'Caso clínico'}
        subtitle={`Criado em ${new Date(c.created_at).toLocaleString('pt-BR')}`}
        action={
          <div className="flex gap-2">
            <Link href="/cases" className="btn-ghost">← Voltar</Link>
            <button onClick={analisar} disabled={busy} className="btn-primary">{busy ? 'Analisando…' : '✦ Analisar (RAG)'}</button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <Card>
          <div className="flex items-center gap-2 mb-2"><StatusBadge status={c.status} /></div>
          <dl className="space-y-1.5 text-sm">
            {Object.keys(FIELD_LABEL).filter((k) => c[k] != null && c[k] !== '').map((k) => (
              <div key={k}><dt className="text-[11px] font-semibold text-slate-400">{FIELD_LABEL[k]}</dt><dd className="text-navy whitespace-pre-wrap">{String(c[k])}</dd></div>
            ))}
          </dl>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {!messages.length && <Card className="text-slate-400 text-sm">Nenhuma análise ainda. Clique em <b>Analisar (RAG)</b>.</Card>}
          {messages.map((m) => (
            <div key={m.id}>
              {m.role === 'assistant' && m.structured ? (
                <>
                  <div className="text-[11px] text-slate-400 mb-1">Resposta IA · {m.model} · {new Date(m.created_at).toLocaleString('pt-BR')}</div>
                  <ClinicalAnswer a={m.structured} />
                </>
              ) : m.role === 'assistant' ? (
                <Card><pre className="text-xs whitespace-pre-wrap">{m.content}</pre></Card>
              ) : (
                <Card className="!bg-slate-50"><div className="text-[11px] text-slate-400 mb-1">Entrada</div><p className="text-sm whitespace-pre-wrap">{m.content}</p></Card>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
