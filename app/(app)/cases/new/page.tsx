'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, Card, Field } from '@/components/ui';
import { postJSON } from '@/hooks/useFetch';

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

export default function NewCasePage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const imc = useMemo(() => {
    const p = Number(form.peso_kg), a = Number(form.altura_m);
    return p > 0 && a > 0 ? (p / (a * a)).toFixed(1) : '';
  }, [form.peso_kg, form.altura_m]);

  async function save(run: boolean) {
    setBusy(true); setErr('');
    const caso: any = {};
    Object.entries(form).forEach(([k, v]) => {
      if (!v) return;
      caso[k] = k === 'idade' ? Number(v) : ['peso_kg', 'altura_m'].includes(k) ? Number(v) : v;
    });
    if (imc) caso.imc = Number(imc);
    try {
      if (run) {
        const r = await postJSON('/api/chat', { caso });
        router.push(`/cases/${r.case_id}`);
      } else {
        const r = await postJSON('/api/cases', caso);
        router.push(`/cases/${r.case_id}`);
      }
    } catch (e: any) { setErr(String(e.message || e)); setBusy(false); }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Novo caso clínico" subtitle="Cadastre o caso. Salve apenas, ou já rode a análise com RAG." />
      <Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SHORT.map(([k, l, t]) => (
            <Field key={k} label={l}><input className="input" type={t || 'text'} step="any" value={form[k] || ''} onChange={(e) => set(k, e.target.value)} /></Field>
          ))}
        </div>
        {imc && <p className="text-xs text-slate-500 mt-1">IMC: <b>{imc}</b> kg/m²</p>}
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          {LONG.map(([k, l]) => (
            <Field key={k} label={l}><textarea className="textarea" rows={2} value={form[k] || ''} onChange={(e) => set(k, e.target.value)} /></Field>
          ))}
        </div>
        {err && <p className="text-sm text-rose-600 bg-rose-50 rounded-lg px-3 py-2 mt-3">{err}</p>}
        <div className="flex flex-wrap gap-2 mt-4">
          <button onClick={() => save(true)} disabled={busy} className="btn-primary">{busy ? '…' : '✦ Salvar e analisar (RAG)'}</button>
          <button onClick={() => save(false)} disabled={busy} className="btn-ghost">Só salvar</button>
        </div>
      </Card>
    </div>
  );
}
