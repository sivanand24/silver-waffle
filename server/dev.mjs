import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { handleGuide } from '../api/guide.mjs';

// Small dependency-free .env loader. Existing environment variables win.
async function loadLocalEnv() {
  for (const filename of ['.env.local', '.env']) {
    try {
      const text = await readFile(new URL(`../${filename}`, import.meta.url), 'utf8');
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!match || !['GEMINI_API_KEY', 'GEMINI_MODEL', 'API_PORT'].includes(match[1]) || process.env[match[1]] !== undefined) continue;
        const value = match[2].replace(/^(?:"(.*)"|'(.*)')$/, '$1$2');
        process.env[match[1]] = value;
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
}

export function createApiServer(options = {}) {
  return createServer(async (req, res) => {
    const path = (req.url || '').split('?')[0];
    if (path === '/api/guide') return handleGuide(req, res, options);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (path === '/api/health' && req.method === 'GET') {
      res.end(JSON.stringify({ geminiConfigured: Boolean((options.env || process.env).GEMINI_API_KEY?.trim()) }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'यह पेज नहीं मिला।' }));
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await loadLocalEnv();
  const port = Number(process.env.API_PORT) || 8787;
  const server = createApiServer();
  server.requestTimeout = 15000;
  server.headersTimeout = 10000;
  server.listen(port, '127.0.0.1', () => console.log(`ApniBaat API ready at http://127.0.0.1:${port}`));
}
