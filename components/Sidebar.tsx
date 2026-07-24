'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
  const [open, setOpen] = useState(false);

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
        <p className="mt-auto pt-8 px-2 text-[11px] text-slate-400 leading-relaxed">
          Apoio à decisão. A decisão final é sempre do médico.
        </p>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <aside className="w-64 bg-navy-900 p-4 overflow-y-auto">{Brand}{Nav}</aside>
          <div className="flex-1 bg-black/40" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
