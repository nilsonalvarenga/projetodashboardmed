// Limpeza + chunking por parágrafos com overlap (alvo ~950 chars).
export interface Chunk { content: string; index: number; }

export function cleanText(t: string): string {
  return t
    .replace(/\r/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

export function chunkText(text: string, target = 950, overlap = 150): Chunk[] {
  const clean = cleanText(text);
  const paras = clean.split(/\n{2,}/);
  const out: string[] = [];
  let buf = '';
  for (const p of paras) {
    if (buf && (buf + '\n\n' + p).length > target) {
      out.push(buf.trim());
      const tail = buf.slice(Math.max(0, buf.length - overlap));
      buf = tail + '\n\n' + p;
    } else {
      buf = buf ? buf + '\n\n' + p : p;
    }
    while (buf.length > target * 1.7) {
      out.push(buf.slice(0, target).trim());
      buf = buf.slice(target - overlap);
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out.filter((c) => c.length > 30).map((content, index) => ({ content, index }));
}

/** Formata um embedding para o literal aceito pelo pgvector ('[a,b,c]'). */
export const toVector = (v: number[]): string => '[' + v.join(',') + ']';
