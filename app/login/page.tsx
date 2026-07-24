'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((d) => setConfigured(!!d.supabase)).catch(() => setConfigured(false));
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    try {
      if (mode === 'signup') {
        const { error } = await supabaseBrowser.auth.signUp({ email, password });
        if (error) throw error;
        setMsg('Conta criada. Se o projeto exigir confirmação por e-mail, confirme antes de entrar.');
        setMode('signin');
      } else {
        const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await fetch('/api/auth/ensure-profile', { method: 'POST' }).catch(() => {});
        const next = new URLSearchParams(window.location.search).get('next') || '/dashboard';
        router.push(next);
        router.refresh();
      }
    } catch (e: any) {
      setErr(e?.message || 'Falha na autenticação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-10 h-10 rounded-lg bg-brand text-white grid place-items-center font-bold">R</span>
          <div className="font-bold text-navy leading-tight">
            Dashboard Médico RAG
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">apoio à decisão — uso interno</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="card p-6 space-y-3">
          <h1 className="font-bold text-navy text-lg">{mode === 'signin' ? 'Entrar' : 'Criar conta'}</h1>

          {configured === false && (
            <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2">
              Supabase ainda não configurado — o login só funciona após preencher as chaves em <code>.env.local</code>.
              Enquanto isso, o app roda em modo demonstração (aberto).
            </p>
          )}

          <label className="block">
            <span className="label">E-mail</span>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          </label>
          <label className="block">
            <span className="label">Senha</span>
            <input className="input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
          </label>

          <button className="btn-primary w-full" disabled={busy || configured === false}>
            {busy ? '…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
          </button>

          {msg && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">{msg}</p>}
          {err && <p className="text-xs text-rose-700 bg-rose-50 rounded-lg px-3 py-2">{err}</p>}

          <p className="text-xs text-slate-500 text-center pt-1">
            {mode === 'signin' ? (
              <>Não tem conta? <button type="button" className="link" onClick={() => { setMode('signup'); setErr(''); }}>Criar conta</button></>
            ) : (
              <>Já tem conta? <button type="button" className="link" onClick={() => { setMode('signin'); setErr(''); }}>Entrar</button></>
            )}
          </p>
        </form>

        <p className="text-[11px] text-slate-400 text-center mt-4">
          Apoio à decisão. A decisão final é sempre do médico.
        </p>
      </div>
    </div>
  );
}
