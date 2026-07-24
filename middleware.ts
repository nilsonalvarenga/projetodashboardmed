import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env, hasSupabase } from '@/lib/env';

// Proteção central de autenticação (páginas + APIs).
// - Modo demonstração (Supabase não configurado): app aberto, sem login.
// - Configurado: exige sessão. Páginas sem sessão → /login; APIs sem sessão → 401.
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Sempre liberados: fluxo de auth e healthcheck de configuração.
  if (path.startsWith('/api/auth') || path === '/api/health') return NextResponse.next();

  // Sem Supabase configurado → modo demo (não bloqueia nada).
  if (!hasSupabase()) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const isApi = path.startsWith('/api');
  const isLogin = path === '/login';

  if (!user) {
    if (isApi) return NextResponse.json({ error: 'Não autenticado. Faça login.' }, { status: 401 });
    if (!isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', path);
      return NextResponse.redirect(url);
    }
  } else if (isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Roda em tudo, menos assets estáticos do Next.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
