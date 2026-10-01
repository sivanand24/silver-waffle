import { INTENTS, DOCUMENT_KEYS, mentionedDocuments } from '../server/knowledge.mjs';
import { getScheme } from '../shared/schemes.js';
import { scopeMismatch, schemeIntent, schemePrompt, scopedAnswer } from '../server/scheme-answers.mjs';

export const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
export const MAX_BODY_BYTES = 12000;
const MAX_QUESTION_LENGTH = 1200;
const buckets = new Map();

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function cleanMap(value, label) {
  if (value === undefined) return {};
  if (!record(value) || Object.keys(value).length > 25) throw new RequestError(400, `${label} is invalid`);
  const result = {};
  for (const [key, item] of Object.entries(value)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(key) || ['constructor', 'prototype', '__proto__'].includes(key)) throw new RequestError(400, `${label} is invalid`);
    if (item !== null && !['string', 'boolean', 'number'].includes(typeof item)) throw new RequestError(400, `${label} is invalid`);
    if ((typeof item === 'string' && item.length > 160) || (typeof item === 'number' && !Number.isFinite(item))) throw new RequestError(400, `${label} is invalid`);
    result[key] = item;
  }
  return result;
}

export function validateBody(body) {
  if (!record(body) || typeof body.question !== 'string' || !body.question.trim() || body.question.length > MAX_QUESTION_LENGTH) {
    throw new RequestError(400, 'एक छोटा सवाल लिखें या बोलें।');
  }
  if (body.context !== undefined && !record(body.context)) throw new RequestError(400, 'सवाल दोबारा भेजें।');
  const schemeId = body.schemeId ?? 'ujjwala';
  if(typeof schemeId !== 'string' || !getScheme(schemeId)) throw new RequestError(400,'सही सहायता का विकल्प चुनें।');
  const context = body.context || {};
  if (context.step !== undefined && (typeof context.step !== 'string' || context.step.length > 60)) throw new RequestError(400, 'सवाल दोबारा भेजें।');
  let documents;
  if (Array.isArray(context.documents)) {
    if (context.documents.length > 25 || context.documents.some((v) => typeof v !== 'string' || v.length > 60)) throw new RequestError(400, 'सवाल दोबारा भेजें।');
    documents = context.documents.slice();
  } else documents = cleanMap(context.documents, 'documents');
  return { schemeId, question: body.question.trim(), context: { step: context.step || '', answers: cleanMap(context.answers, 'answers'), documents } };
}

// Only the user's short question and bounded preparation context go to Gemini.
// Long numeric identifiers are masked even if entered accidentally.
function redactIdentifiers(text) {
  return text.replace(/(?<!\p{N})(?:\p{Nd}[\s-]?){9,}\p{Nd}(?!\p{N})/gu, '[निजी नंबर हटाया गया]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[ईमेल हटाया गया]');
}

export function buildGeminiRequest(input) {
  return {
    systemInstruction: { parts: [{ text: schemePrompt(input.schemeId || 'ujjwala') }] },
    contents: [{ role: 'user', parts: [{ text: redactIdentifiers(JSON.stringify(input)) }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          intent: { type: 'STRING', enum: INTENTS },
          mentionedDocuments: { type: 'ARRAY', items: { type: 'STRING', enum: DOCUMENT_KEYS } },
        },
        required: ['intent', 'mentionedDocuments'],
      },
      maxOutputTokens: 512,
    },
  };
}

export async function answerQuestion(rawInput, options = {}) {
  const input = validateBody(rawInput);
  const env = options.env || process.env;
  const key = env.GEMINI_API_KEY?.trim();
  let intent = schemeIntent(input.schemeId,input.question,input.context);
  let mentioned = mentionedDocuments(input.question);
  let mode = 'offline';
  // Gemini understands varied language; fixed, source-reviewed responses keep
  // benefit rules and official-submission boundaries independent of model output.
  if (key && intent !== 'emergency' && !scopeMismatch(input.schemeId,input.question)) {
    const candidate = env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
    const model = /^gemini-[a-z0-9.-]{1,80}$/.test(candidate) ? candidate : DEFAULT_MODEL;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 9000);
    try {
      const response = await (options.fetch || globalThis.fetch)(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(buildGeminiRequest(input)), signal: controller.signal,
      });
      if (response.ok) {
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.filter((part) => !part.thought).map((part) => part.text || '').join('');
        const parsed = JSON.parse(text);
        if (record(parsed) && INTENTS.includes(parsed.intent) && Array.isArray(parsed.mentionedDocuments) && parsed.mentionedDocuments.every((item) => DOCUMENT_KEYS.includes(item))) {
          intent = parsed.intent;
          mentioned = [...new Set(parsed.mentionedDocuments)].slice(0, DOCUMENT_KEYS.length);
          mode = 'live';
        }
      }
    } catch { /* Do not expose upstream messages, request details, or credentials. */ }
    finally { clearTimeout(timeout); }
  }
  return { answer: scopedAnswer(input.schemeId,intent,input.context,mentioned,input.question), mode, sourceUrl: getScheme(input.schemeId).source };
}

function send(res, status, value) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(value));
}

function checkOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; }
  catch { return false; }
}

function rateAllowed(req, now = Date.now()) {
  for (const [key, bucket] of buckets) if (now - bucket.started >= 60000) buckets.delete(key);
  if (buckets.size > 1000) return false;
  const forwarded = process.env.VERCEL ? req.headers['x-forwarded-for']?.split(',')[0]?.trim() : undefined;
  const key = forwarded || req.socket?.remoteAddress || 'local';
  const bucket = buckets.get(key) || { started: now, count: 0 };
  bucket.count += 1;
  buckets.set(key, bucket);
  return bucket.count <= 30;
}

async function readBody(req) {
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) throw new RequestError(413, 'सवाल बहुत लंबा है। छोटा सवाल भेजें।');
  if (req.body !== undefined) {
    const serialized = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(serialized) > MAX_BODY_BYTES) throw new RequestError(413, 'सवाल बहुत लंबा है।');
    try { return typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { throw new RequestError(400, 'सवाल दोबारा भेजें।'); }
  }
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > MAX_BODY_BYTES) throw new RequestError(413, 'सवाल बहुत लंबा है।');
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new RequestError(400, 'सवाल दोबारा भेजें।'); }
}

export async function handleGuide(req, res, options = {}) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return send(res, 405, { error: 'यहाँ अपना सवाल भेजें।' });
    }
    if (!checkOrigin(req)) return send(res, 403, { error: 'अपनी बात के पेज से सवाल भेजें।' });
    if (!rateAllowed(req)) {
      res.setHeader('Retry-After', '60');
      return send(res, 429, { error: 'कुछ पल रुककर फिर सवाल पूछें।' });
    }
    if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return send(res, 415, { error: 'सवाल दोबारा भेजें।' });
    return send(res, 200, await answerQuestion(await readBody(req), options));
  } catch (error) {
    return send(res, error instanceof RequestError ? error.status : 500, { error: error instanceof RequestError && /[\u0900-\u097F]/u.test(error.message) ? error.message : 'सवाल दोबारा भेजें।' });
  }
}

export default handleGuide;
