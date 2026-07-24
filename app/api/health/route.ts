import { NextResponse } from 'next/server';
import { configStatus, env } from '@/lib/env';

export const runtime = 'nodejs';

// Status de configuração — usado pela UI para mostrar o banner de setup.
export async function GET() {
  return NextResponse.json({ appName: env.appName, ...configStatus() });
}
