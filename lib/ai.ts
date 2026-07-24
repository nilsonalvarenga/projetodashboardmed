// Camada de IA: embeddings (OpenAI) + geração da resposta (OpenAI ou Claude).
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const EMBED_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const PROVIDER = (process.env.LLM_PROVIDER || 'openai').toLowerCase();

let _openai: OpenAI | null = null;
function openai(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}
let _anthropic: Anthropic | null = null;
function anthropic(): Anthropic {
  if (!_anthropic) _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _anthropic;
}

/** Gera embeddings (lote). Dimensão deve casar com o schema (1536 p/ -3-small). */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const res = await openai().embeddings.create({ model: EMBED_MODEL, input: texts });
  return res.data.map((d) => d.embedding as number[]);
}

export async function embedOne(text: string): Promise<number[]> {
  return (await embed([text]))[0];
}

export interface ChatResult { text: string; model: string; tokensPrompt?: number; tokensCompletion?: number; }

/** Geração da resposta clínica. JSON-mode quando OpenAI; baixa temperatura (segurança). */
export async function generate(system: string, user: string, opts?: { json?: boolean }): Promise<ChatResult> {
  if (PROVIDER === 'anthropic') {
    const model = process.env.ANTHROPIC_CHAT_MODEL || 'claude-sonnet-4-6';
    const r = await anthropic().messages.create({
      model, max_tokens: 4000, temperature: 0.1,
      system, messages: [{ role: 'user', content: user }],
    });
    const text = r.content.map((b: any) => (b.type === 'text' ? b.text : '')).join('');
    return { text, model, tokensPrompt: r.usage?.input_tokens, tokensCompletion: r.usage?.output_tokens };
  }
  // default: OpenAI
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4.1';
  const r = await openai().chat.completions.create({
    model, temperature: 0.1,
    ...(opts?.json ? { response_format: { type: 'json_object' } } : {}),
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  });
  return {
    text: r.choices[0]?.message?.content || '',
    model,
    tokensPrompt: r.usage?.prompt_tokens,
    tokensCompletion: r.usage?.completion_tokens,
  };
}

/** Extrai o primeiro objeto JSON de um texto (defensivo p/ provedores sem json-mode). */
export function parseJsonLoose<T = any>(text: string): T | null {
  try { return JSON.parse(text) as T; } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]) as T; } catch {} }
  return null;
}
