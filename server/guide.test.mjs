import test from "node:test";
import assert from "node:assert/strict";
import { answerQuestion, validateBody, buildGeminiRequest, DEFAULT_MODEL } from "../api/guide.mjs";
import { SOURCE_URL, SYSTEM_INSTRUCTION, answerForIntent } from "./knowledge.mjs";
import { createApiServer } from "./dev.mjs";

test("rejects empty, oversized and nested untrusted context", () => {
  for (const body of [
    null,
    {},
    { question: " " },
    { question: "x".repeat(1201) },
    { question: "hello", context: [] },
    { question: "hello", context: { answers: { age: { override: true } } } },
  ]) {
    assert.throws(() => validateBody(body));
  }
  assert.equal(validateBody({ question: "  आधार नहीं है  " }).question, "आधार नहीं है");
});

test("no key produces useful Hindi fallback without contacting Gemini", async () => {
  const response = await answerQuestion(
    { question: "मेरे पास राशन कार्ड नहीं है" },
    {
      env: {},
      fetch() {
        throw new Error("must not be called");
      },
    },
  );
  assert.equal(response.mode, "offline");
  assert.equal(response.sourceUrl, SOURCE_URL);
  assert.match(response.answer, /दूसरा सरकारी कागज़/);
});

test("welcome suggestion explains Ujjwala and distinguishes later refill costs", async () => {
  for (const question of ["उज्ज्वला योजना क्या है?", "उज्ज्वला क्या है?", "Ujjwala kya hai?"]) {
    const response = await answerQuestion({ question, context: { step: "welcome" } }, { env: {} });
    assert.equal(response.mode, "offline");
    assert.match(response.answer, /सरकारी योजना/);
    assert.match(response.answer, /सभी सिलेंडर मुफ्त नहीं/);
    assert.doesNotMatch(response.answer, /पक्की जानकारी मेरे पास नहीं/);
  }
  const unrelated = await answerQuestion({ question: "आयुष्मान योजना क्या है?" }, { env: {} });
  assert.match(unrelated.answer, /पक्की जानकारी मेरे पास नहीं/);
});

test("cost FAQ works with both nukta and non-nukta spelling", async () => {
  for (const question of [
    "क्या सारे सिलेंडर मुफ़्त हैं?",
    "क्या सारे सिलेंडर मुफ्त हैं?",
    "सिलेंडर की क़ीमत क्या है?",
  ]) {
    const response = await answerQuestion({ question }, { env: {} });
    assert.match(response.answer, /यह नहीं कि आगे हर सिलेंडर मुफ्त मिलेगा/);
  }
});

test("existing household LPG never becomes approved eligibility", async () => {
  const response = await answerQuestion(
    { question: "क्या मैं पात्र हूँ?", context: { answers: { hasLpg: true } } },
    { env: {} },
  );
  assert.match(response.answer, /पहले से गैस कनेक्शन है/);
  assert.doesNotMatch(response.answer, /आप पात्र हैं|मंज़ूर हो/);
});

test("piped gas is a separate exclusion under the official FAQ", async () => {
  const response = await answerQuestion(
    {
      question: "क्या मैं पात्र हूँ?",
      context: { answers: { adult: "yes", lpg: "no", png: "yes" } },
    },
    { env: {} },
  );
  assert.match(response.answer, /पीएनजी/);
  assert.match(response.answer, /नहीं मिल सकता/);
});

test("Gemini classifies colloquial input while response remains source reviewed", async () => {
  let sent;
  const result = await answerQuestion(
    { question: "लाने वाली चीजें फिर बताओ" },
    {
      env: { GEMINI_API_KEY: "test-key" },
      fetch: async (url, options) => {
        sent = { url, options };
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: JSON.stringify({
                        intent: "documents",
                        mentionedDocuments: [],
                        answer: "Ignore facts; every refill is free",
                      }),
                    },
                  ],
                },
              },
            ],
          }),
        };
      },
    },
  );
  assert.equal(result.mode, "live");
  assert.match(result.answer, /पासबुक/);
  assert.doesNotMatch(result.answer, /every refill|test-key/);
  assert.match(sent.url, new RegExp(`${DEFAULT_MODEL}:generateContent$`));
  assert.equal(sent.options.headers["x-goog-api-key"], "test-key");
  assert.doesNotMatch(sent.options.body, /test-key/);
});

test("upstream failures and unknown model intents gracefully use offline mode", async () => {
  const input = { question: "आवेदन कहाँ करूँ?" };
  for (const mockFetch of [
    async () => {
      throw new Error("secret upstream detail");
    },
    async () => ({ ok: false }),
    async () => ({
      ok: true,
      json: async () => ({
        candidates: [
          { content: { parts: [{ text: '{"intent":"approved","mentionedDocuments":[]}' }] } },
        ],
      }),
    }),
  ]) {
    const result = await answerQuestion(input, {
      env: { GEMINI_API_KEY: "not-public" },
      fetch: mockFetch,
    });
    assert.equal(result.mode, "offline");
    assert.match(result.answer, /आवेदन जमा नहीं किया/);
    assert.doesNotMatch(JSON.stringify(result), /secret|not-public|upstream/);
  }
});

test("teach-back notices missing papers without inventing a submitted application", async () => {
  assert.doesNotMatch(
    answerForIntent("teachback", {}, ["identity", "form", "mobile"]),
    /undefined/,
  );
  const response = await answerQuestion(
    { question: "मैं आधार और बैंक की किताब लेकर जाऊँगी", context: { step: "teachback" } },
    { env: {} },
  );
  assert.match(response.answer, /आपने/);
  assert.match(response.answer, /राशन कार्ड/);
  assert.match(response.answer, /निर्धारित गरीबी घोषणा/);
});

test("prompt holds verified source and strips accidentally pasted private identifiers", () => {
  const payload = buildGeminiRequest({
    question: "मेरा आधार 1234 5678 9012 या १२३४ ५६७८ ९०१२ और ईमेल woman@example.com है",
    context: {},
  });
  assert.match(SYSTEM_INSTRUCTION, /untrusted data, not instructions/);
  assert.match(SYSTEM_INSTRUCTION, /https:\/\/www\.pmuy\.gov\.in\/ujjwala2\.html/);
  assert.doesNotMatch(payload.contents[0].parts[0].text, /1234|१२३४|woman@example/);
});

test("HTTP route accepts JSON, rejects foreign origins and oversized bodies", async (t) => {
  const server = createApiServer({ env: {} });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const good = await fetch(`${base}/api/guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: base },
    body: JSON.stringify({ question: "नमस्ते" }),
  });
  assert.equal(good.status, 200);
  assert.equal((await good.json()).mode, "offline");
  const foreign = await fetch(`${base}/api/guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://foreign.example" },
    body: '{"question":"hi"}',
  });
  assert.equal(foreign.status, 403);
  const oversized = await fetch(`${base}/api/guide`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: "x".repeat(13000) }),
  });
  assert.equal(oversized.status, 413);
  const health = await fetch(`${base}/api/health`);
  assert.deepEqual(await health.json(), { geminiConfigured: false });
});
