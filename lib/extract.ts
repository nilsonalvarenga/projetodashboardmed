// Extração de texto server-side por tipo de arquivo.
import type { ContentType } from './types';

export async function extractText(buf: Buffer, type: ContentType, filename: string): Promise<string> {
  const ext = (filename.split('.').pop() || '').toLowerCase();

  if (type === 'pdf' || ext === 'pdf') {
    const pdf = (await import('pdf-parse')).default as any;
    const d = await pdf(buf);
    return d.text || '';
  }
  if (type === 'docx' || ext === 'docx') {
    const mammoth = await import('mammoth');
    const r = await mammoth.extractRawText({ buffer: buf });
    return r.value || '';
  }
  if (type === 'xlsx' || ext === 'xlsx' || ext === 'xls') {
    const XLSX = await import('xlsx');
    const wb = XLSX.read(buf, { type: 'buffer' });
    return wb.SheetNames.map((n) => `# ${n}\n` + XLSX.utils.sheet_to_csv(wb.Sheets[n])).join('\n\n');
  }
  // csv, txt, markdown, transcricao, anotacao, outro → texto puro
  return buf.toString('utf8');
}
