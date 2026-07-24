import { NextResponse } from 'next/server';
import { getUserWithRole } from '@/lib/auth';
import { hasSupabase } from '@/lib/env';

export const runtime = 'nodejs';

// Identidade do usuário logado + papel (para a UI). Público quando em modo demo.
export async function GET() {
  if (!hasSupabase()) return NextResponse.json({ configured: false, user: null, role: null });
  const { user, role } = await getUserWithRole();
  return NextResponse.json({
    configured: true,
    user: user ? { id: user.id, email: user.email } : null,
    role,
  });
}
