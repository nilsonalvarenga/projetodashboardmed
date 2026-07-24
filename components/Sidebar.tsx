'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabaseBrowserClient';

type Item = { href: string; label: string; icon: string };
type Group = { title: string; items: Item[] };

const GROUPS: Group[] = [
  {
    title: 'Visão geral',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: '▦' },
      { href: '/chat', label: 'Chat clínico', icon: '✦' },
      { href: '/cases', label: 'Casos clínicos', icon: '🗂' },
    ],
  },
  {
    title: 'Base de conhecimento',
    items: [
      { href: '/documents', label: 'Documentos', icon: '📄' },
      { href: '/documents/upload', label: 'Enviar conteúdo', icon: '⬆' },
      { href: '/knowledge', label: 'Busca', icon: '🔎' },
    ],
  },
  {
    title: 'Extrações',
    items: [
      { href: '/medications', label: 'Medicações', icon: '💊' },
      { href: '/supplements', label: 'Vitaminas/Suplementos', icon: '🧪' },
      { href: '/protocols', label: 'Protocolos', icon: '📋' },
      { href: '/conducts', label: 'Condutas', icon: '🩺' },
    ],
  },
  {
    title: 'Governança',
    items: [
      { href: '/review', label: 'Revisão médica', icon: '✅' },
      { href: '/settings', label: 'Configurações', icon: '⚙' },
    ],
  },
];

export default function Sidebar() {
  const p = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabaseBrowser.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null)).catch(() => {});
  }, []);

  async function logout() {
    try { await supabaseBrowser.auth.signOut(); } catch {}
    router.push('/login');
    router.refresh();
  }

  const UserFooter = userEmail ? (
    <div className="mb-3">
      <div className="px-2 text-[11px] text-slate-400 truncate mb-1.5" title={userEmail}>👤 {userEmail}</div>
      <button onClick={logout}
        className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition text-left">
        <span className="w-4 text-center">↩</span> Sair
      </button>
    </div>
  ) : null;

  const Nav = (
    <nav className="space-y-5">
      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{g.title}</div>
          <div className="space-y-0.5">
            {g.items.map((n) => {
              const active = p === n.href || (n.href !== '/dashboard' && n.href !== '/documents' && p.startsWith(n.href))
                || (n.href === '/documents' && p === '/documents');
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active ? 'bg-brand text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="w-4 text-center opacity-80">{n.icon}</span>
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const Brand = (
    <div className="flex items-center gap-2 px-2 mb-6">
      <span className="w-9 h-9 rounded-lg bg-brand text-white grid place-items-center font-bold">R</span>
      <div className="font-bold leading-tight text-white">
        RAG Médico
        <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-medium">apoio à decisão</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Topbar mobile */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-navy-900 text-white px-4 py-3">
        <span className="font-bold">RAG Médico</span>
        <button onClick={() => setOpen((v) => !v)} className="text-2xl leading-none" aria-label="Menu">☰</button>
      </div>

      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-navy-900 min-h-screen p-4">
        {Brand}
        {Nav}
        <div className="mt-auto pt-6">
          {UserFooter}
          <p className="px-2 text-[11px] text-slate-400 leading-relaxed">
            Apoio à decisão. A decisão final é sempre do médico.
          </p>
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <aside className="w-64 bg-navy-900 p-4 overflow-y-auto flex flex-col">{Brand}{Nav}<div className="mt-6">{UserFooter}</div></aside>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
