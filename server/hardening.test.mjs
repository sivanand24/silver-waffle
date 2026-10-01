import test from "node:test";
import assert from "node:assert/strict";
import { readFile, mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import http from "node:http";
import { clientKey, createRateLimiter, isSameOrigin } from "./guard.mjs";
import { CSP, SECURITY_HEADERS } from "./security-headers.mjs";
import { createApiServer } from "./dev.mjs";
import { answerQuestion } from "../api/guide.mjs";

test("same-origin guard rejects foreign and malformed origins", () => {
  const req = (origin, host = "app.test") => ({ headers: { origin, host } });
  assert.equal(isSameOrigin(req("https://app.test")), true);
  assert.equal(isSameOrigin(req("https://evil.test")), false);
  assert.equal(isSameOrigin(req("not a url")), false);
  assert.equal(isSameOrigin({ headers: { host: "app.test" } }), true);
});

test("client key trusts x-forwarded-for only on Vercel", () => {
  const req = {
    headers: { "x-forwarded-for": "9.9.9.9, 1.1.1.1" },
    socket: { remoteAddress: "127.0.0.1" },
  };
  assert.equal(clientKey(req, { VERCEL: "1" }), "9.9.9.9");
  assert.equal(clientKey(req, {}), "127.0.0.1");
});

test("rate limiter enforces the window, resets after it, and caps tracked keys", () => {
  const allow = createRateLimiter({ max: 3, windowMs: 1000, maxKeys: 2 });
  assert.deepEqual(
    [1, 2, 3, 4].map(() => allow("a", 0)),
    [true, true, true, false],
  );
  assert.equal(allow("a", 999), false, "still inside the window");
  assert.equal(allow("a", 1000), true, "a new window starts");
  allow("b", 1000);
  assert.equal(allow("c", 1000), false, "refuses new keys beyond the cap instead of growing");
});

test("expired entries are swept so memory stays bounded", () => {
  const allow = createRateLimiter({ max: 1, windowMs: 1000, maxKeys: 2 });
  allow("a", 0);
  allow("b", 0);
  assert.equal(allow("c", 5000), true, "old keys were swept and make room");
});

test("vercel.json serves exactly the security headers the app defines", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
  const site = config.headers.find((h) => h.source === "/(.*)");
  const served = Object.fromEntries(site.headers.map((h) => [h.key, h.value]));
  assert.deepEqual(served, SECURITY_HEADERS);
  assert.match(CSP, /default-src 'self'/);
  assert.match(CSP, /frame-ancestors 'none'/);
  assert.doesNotMatch(CSP, /script-src[^;]*unsafe/);
});

test("static server sends security headers, gzip and immutable caching for assets", async () => {
  const dir = await mkdtemp(join(tmpdir(), "apnibaat-static-"));
  await mkdir(join(dir, "assets"));
  const js = "export const x = '" + "a".repeat(5000) + "';";
  await writeFile(join(dir, "assets", "app.js"), js);
  await writeFile(join(dir, "index.html"), "<h1>home</h1>");
  const server = createApiServer({ env: {}, staticDir: dir });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const port = server.address().port;
  const get = (path, headers = {}) =>
    new Promise((resolve, reject) =>
      http
        .get({ host: "127.0.0.1", port, path, headers }, (res) => {
          const parts = [];
          res.on("data", (c) => parts.push(c));
          res.on("end", () => resolve({ res, body: Buffer.concat(parts) }));
        })
        .on("error", reject),
    );
  try {
    const gz = await get("/assets/app.js", { "accept-encoding": "gzip" });
    assert.equal(gz.res.headers["content-encoding"], "gzip");
    assert.ok(gz.body.length < js.length / 5, "payload is actually compressed");
    assert.equal(gunzipSync(gz.body).toString(), js);
    assert.match(gz.res.headers["cache-control"], /immutable/);
    assert.equal(gz.res.headers["content-security-policy"], CSP);
    assert.equal(gz.res.headers["x-frame-options"], "DENY");

    const plain = await get("/assets/app.js");
    assert.equal(plain.res.headers["content-encoding"], undefined);
    assert.equal(plain.body.toString(), js);

    const page = await get("/");
    assert.equal(
      page.res.headers["cache-control"],
      "no-store",
      "the HTML shell is never cached, so a redeploy shows up at once",
    );
  } finally {
    server.close();
  }
});

test("identical questions reuse the classified intent instead of calling the model again", async () => {
  let calls = 0;
  const options = {
    env: { GEMINI_API_KEY: "test-key" },
    fetch: async () => {
      calls += 1;
      return {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: JSON.stringify({ intent: "documents", mentionedDocuments: [] }) }],
              },
            },
          ],
        }),
      };
    },
  };
  const question = { question: "कौन से कागज़ चाहिए, दोबारा बताइए?" };
  const first = await answerQuestion(question, options);
  const second = await answerQuestion(question, options);
  assert.equal(calls, 1);
  assert.equal(second.mode, "live");
  assert.equal(second.answer, first.answer);

  await answerQuestion({ question: "एक बिल्कुल अलग सवाल" }, options);
  assert.equal(calls, 2, "a different question is still classified");
});

test("failed model calls are not cached", async () => {
  let calls = 0;
  const options = {
    env: { GEMINI_API_KEY: "test-key" },
    fetch: async () => {
      calls += 1;
      throw new Error("down");
    },
  };
  const question = { question: "यह सवाल कैश नहीं होना चाहिए" };
  assert.equal((await answerQuestion(question, options)).mode, "offline");
  assert.equal((await answerQuestion(question, options)).mode, "offline");
  assert.equal(calls, 2);
});
