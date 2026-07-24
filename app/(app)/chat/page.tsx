'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PageHeader, Card, Spinner, Field } from '@/components/ui';
import ClinicalAnswer from '@/components/ClinicalAnswer';
import { CLINICAL_CATEGORIES, CATEGORY_LABEL } from '@/lib/categories';

const SHORT: [string, string, string?][] = [
  ['idade', 'Idade', 'number'], ['sexo', 'Sexo'], ['peso_kg', 'Peso (kg)', 'number'], ['altura_m', 'Altura (m)', 'number'],
];
const LONG: [string, string][] = [
  ['queixa_principal', 'Queixa principal'], ['historia_clinica', 'História clínica'],
  ['doencas_previas', 'Doenças prévias'], ['medicacoes_uso', 'Medicações em uso'],
  ['alergias', 'Alergias'], ['exames_lab', 'Exames laboratoriais'],
  ['exames_imagem', 'Exames de imagem'], ['objetivo_consulta', 'Objetivo da consulta'],
  ['restricoes_paciente', 'Restrições do paciente'], ['observacoes_medico', 'Observações do médico'],
];

export default function ChatPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [cats, setCats] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [err, setErr] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const imc = useMemo(() => {
    const p = Number(form.peso_kg), a = Number(form.altura_m);
    if (p > 0 && a > 0) return (p / (a * a)).toFixed(1);
    return '';
  }, [form.peso_kg, form.altura_m]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(''); setRes(null);
    const caso: any = {};
    Object.entries(form).forEach(([k, v]) => {
      if (!v) return;
      caso[k] = ['idade'].includes(k) ? Number(v) : ['peso_kg', 'altura_m'].includes(k) ? Number(v) : v;
    });
    if (imc) caso.imc = Number(imc);
    try {
      const r = await fetch('/api/chat', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ caso, categories: cats.length ? cats : undefined }),
      });
      const j = await r.json();
      if (!r.ok || j.error) setErr(j.error || `Erro ${r.status}`); else setRes(j);
    } catch (e: any) { setErr(String(e.message || e)); }
    finally { setBusy(false); }
  }

  const a = res?.structured;

  return (
    <div>
      <PageHeader
        title="Chat clínico (RAG)"
        subtitle="Descreva o caso. O sistema busca no acervo do médico e devolve raciocínio + conduta sugeridos, sempre citando as fontes internas."
      />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <form onSubmit={onSubmit} className="card p-5 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SHORT.map(([k, l, t]) => (
              <Field key={k} label={l}>
                <input className="input" type={t || 'text'} step="any" value={form[k] || ''} onChange={(e) => set(k, e.target.value)} />
              </Field>
            ))}
          </div>
          {imc && <p className="text-xs text-slate-500 -mt-1">IMC calculado: <b>{imc}</b> kg/m²</p>}

          {LONG.map(([k, l]) => (
            <Field key={k} label={l}>
              <textarea className="textarea" rows={2} value={form[k] || ''} onChange={(e) => set(k, e.target.value)} />
            </Field>
          ))}

          <div>
            <span className="label">Filtrar busca por categorias (opcional)</span>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1">
              {CLINICAL_CATEGORIES.map((c) => {
                const on = cats.includes(c);
                return (
                  <button type="button" key={c} onClick={() => setCats((p) => on ? p.filter((x) => x !== c) : [...p, c])}
                    className={`chip ${on ? '!bg-brand !text-white' : ''}`}>
                    {CATEGORY_LABEL[c]}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Analisando…' : '✦ Analisar caso'}</button>
          {err && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}
        </form>

        <div>
          {!res && !busy && (
            <Card className="text-slate-400 text-sm">
              Preencha o caso e clique em <b>Analisar caso</b>. A resposta sai em 12 seções, separando o que veio da base
              (com citação <span className="text-brand font-semibold">[n]</span>) do que é raciocínio inferido.
            </Card>
          )}
          {busy && <Card><Spinner label="Recuperando trechos da base e gerando o raciocínio clínico…" /></Card>}
          {a && (
            <>
              {res.case_id && (
                <div className="mb-3 text-sm">
                  Caso salvo. <Link href={`/cases/${res.case_id}`} className="link">abrir histórico do caso →</Link>
                </div>
              )}
              <ClinicalAnswer a={a} sources={res.sources} />
            </>
          )}
          {res && !a && (
            <Card><h2 className="font-bold mb-2">Resposta (não estruturada)</h2>
              <pre className="text-xs whitespace-pre-wrap">{res.raw}</pre></Card>
          )}
        </div>
      </div>
    </div>
  );
}
