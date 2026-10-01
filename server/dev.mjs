import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";
import { handleGuide } from "../api/guide.mjs";
import handleTranscribe from "../api/transcribe.mjs";

// Small dependency-free .env loader. Existing environment variables win.
async function loadLocalEnv() {
  for (const filename of [".env.local", ".env"]) {
    try {
      const text = await readFile(
        new URL(`../${filename}`, import.meta.url),
        "utf8",
      );
      for (const line of text.split(/\r?\n/)) {
        const match = line.match(
          /^\s*(?:export\s+)?([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/,
        );
        if (
          !match ||
          ![
            "GEMINI_API_KEY",
            "GEMINI_MODEL",
            "GEMINI_AUDIO_MODEL",
            "API_PORT",
          ].includes(match[1]) ||
          process.env[match[1]] !== undefined
        )
          continue;
        const value = match[2].replace(/^(?:"(.*)"|'(.*)')$/, "$1$2");
        process.env[match[1]] = value;
      }
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

const gzipCache = new Map();
export function createApiServer(options = {}) {
  return createServer(async (req, res) => {
    const path = (req.url || "").split("?")[0];
    if (path === "/api/guide") return handleGuide(req, res, options);
    if (path === "/api/transcribe") return handleTranscribe(req, res, options);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    if (path === "/api/health" && req.method === "GET") {
      res.end(
        JSON.stringify({
          geminiConfigured: Boolean(
            (options.env || process.env).GEMINI_API_KEY?.trim(),
          ),
        }),
      );
    } else if (
      options.staticDir &&
      ["GET", "HEAD"].includes(req.method) &&
      !path.startsWith("/api/")
    ) {
      try {
        const root = resolve(options.staticDir);
        const decoded = decodeURIComponent(path);
        const target = resolve(
          root,
          "." + (decoded === "/" ? "/index.html" : decoded),
        );
        const types = {
          ".html": "text/html; charset=utf-8",
          ".js": "text/javascript; charset=utf-8",
          ".css": "text/css; charset=utf-8",
          ".svg": "image/svg+xml",
          ".png": "image/png",
          ".ico": "image/x-icon",
          ".webp": "image/webp",
          ".woff2": "font/woff2",
        };
        if (
          !target.startsWith(root + sep) ||
          !types[extname(target)] ||
          decoded.split(/[\\/]/).some((p) => p.startsWith("."))
        )
          throw new Error("invalid");
        const content = await readFile(target);
        res.setHeader("Content-Type", types[extname(target)]);
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader(
          "Permissions-Policy",
          "camera=(), geolocation=(), microphone=(self)",
        );
        if (decoded.startsWith("/assets/"))
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        let body = content;
        if (/gzip/.test(req.headers["accept-encoding"] || "") && /text|javascript|svg/.test(types[extname(target)]) && content.length > 1024) {
          body = gzipCache.get(target) || gzipCache.set(target, gzipSync(content)).get(target);
          res.setHeader("Content-Encoding", "gzip");
          res.setHeader("Vary", "Accept-Encoding");
        }
        res.end(req.method === "HEAD" ? undefined : body);
      } catch {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "यह पेज नहीं मिला।" }));
      }
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: "यह पेज नहीं मिला।" }));
    }
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await loadLocalEnv();
  const port = Number(process.env.API_PORT) || 8787;
  const server = createApiServer({
    staticDir: process.argv.includes("--serve-dist")
      ? fileURLToPath(new URL("../dist/", import.meta.url))
      : undefined,
  });
  server.requestTimeout = 30000;
  server.headersTimeout = 10000;
  server.listen(port, "127.0.0.1", () =>
    console.log(`ApniBaat API ready at http://127.0.0.1:${port}`),
  );
}
