// Papéis e capacidades (espelha o ENUM user_role do banco).
// Client-safe: sem imports de servidor. Usado no backend (auth) e na UI (Sidebar).

export type UserRole = 'admin' | 'medico' | 'revisor' | 'leitor';

// Capacidades = ações sensíveis. Leitura (GET) é liberada a qualquer autenticado.
export type Capability =
  | 'chat'    // rodar chat clínico / criar casos
  | 'ingest'  // enviar/extrair/excluir documentos e fontes
  | 'review'  // aprovar/rejeitar/corrigir extrações
  | 'admin';  // gestão de usuários/papéis

const CAPS: Record<UserRole, Capability[]> = {
  admin:   ['chat', 'ingest', 'review', 'admin'],
  medico:  ['chat', 'ingest', 'review'],
  revisor: ['review'],
  leitor:  [],
};

export function can(role: UserRole | null | undefined, cap: Capability): boolean {
  if (!role) return false;
  return CAPS[role]?.includes(cap) ?? false;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  medico: 'Médico',
  revisor: 'Revisor',
  leitor: 'Leitor',
};

export const ALL_ROLES: UserRole[] = ['admin', 'medico', 'revisor', 'leitor'];
