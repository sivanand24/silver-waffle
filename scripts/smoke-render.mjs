// Server-renders every screen and component for all three schemes with real data.
// Catches wiring mistakes (missing props, bad imports) that unit tests cannot see.
import { createServer } from "vite";
import React from "react";
import { renderToString } from "react-dom/server";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const server = await createServer({
  root,
  configFile: false,
  logLevel: "silent",
  server: { middlewareMode: true },
  appType: "custom",
  esbuild: { jsx: "automatic" },
});
const load = (p) => server.ssrLoadModule(p).then((m) => m.default);
const schemes = await server.ssrLoadModule("/shared/schemes.js");
const h = React.createElement;
const noop = () => {};
const results = [];
function check(name, el, ...must) {
  const html = renderToString(el);
  const missing = must.filter((m) => !html.includes(m));
  results.push([name, html.length, missing]);
}
const App = await load("/src/App.jsx");
check("App(select)", h(App), "अपनी बात कहिए", "गैस कनेक्शन", "ApniBaat");
for (const id of Object.keys(schemes.SCHEMES)) {
  const scheme = schemes.getScheme(id);
  const qs = schemes.getQuestions(id, {});
  const idle = {
    status: "idle",
    target: "answer",
    transcript: "",
    level: 0,
    seconds: 0,
    error: "",
  };
  check(
    id + " welcome",
    h(await load("/src/screens/WelcomeScreen.jsx"), {
      headingRef: null,
      scheme,
      onStart: noop,
      onExplain: noop,
    }),
    scheme.headline,
  );
  check(
    id + " question",
    h(await load("/src/screens/QuestionScreen.jsx"), {
      headingRef: null,
      question: qs[0],
      index: 0,
      total: qs.length,
      answer: "yes",
      onChoose: noop,
      voice: idle,
      onListen: noop,
      voicePanel: null,
      onSpeak: noop,
    }),
    qs[0].title,
    "choice yes selected",
  );
  check(
    id + " assessment",
    h(await load("/src/screens/AssessmentScreen.jsx"), {
      headingRef: null,
      scheme,
      assessment: schemes.schemeAssessment(id, {}),
      onContinue: noop,
      onExplain: noop,
    }),
    "मुझे थोड़ा और समझाइए",
  );
  check(
    id + " documents",
    h(await load("/src/screens/DocumentsScreen.jsx"), {
      headingRef: null,
      scheme,
      documents: { [scheme.documents[0].id]: "ready" },
      onMark: noop,
      onSpeak: noop,
      onFinish: noop,
    }),
    scheme.documents[0].title,
    "document-card ready",
  );
  check(
    id + " result",
    h(await load("/src/screens/ResultScreen.jsx"), {
      headingRef: null,
      scheme,
      summary: schemes.documentSummary(id, {}),
      onSave: noop,
      onReadList: noop,
      onPractice: noop,
      onSpeak: noop,
    }),
    "आवेदन अभी जमा नहीं हुआ है।",
  );
  check(
    id + " guide dialog",
    h(await load("/src/components/GuideDialog.jsx"), {
      open: false,
      onClose: noop,
      teachback: false,
      scheme,
      configured: true,
      busy: false,
      query: "",
      onQueryChange: noop,
      onAsk: noop,
      reply: { mode: "live", answer: "उत्तर", sourceUrl: scheme.source },
      voice: idle,
      voicePanel: null,
      onListen: noop,
      onSpeak: noop,
      notice: "",
    }),
    "ApniBaat का जवाब",
    scheme.suggestions[0],
  );
  check(
    id + " footer",
    h(await load("/src/components/Footer.jsx"), { scheme, showRestart: true, onRestart: noop }),
    "फिर से शुरू करें",
  );
}
const VP = await load("/src/components/VoicePanel.jsx");
check(
  "voice review",
  h(VP, {
    voice: {
      status: "review",
      target: "answer",
      transcript: "हाँ",
      level: 0,
      seconds: 0,
      error: "",
    },
    target: "answer",
    heardText: "हाँ",
    onHeardTextChange: noop,
    onConfirm: noop,
    onRetry: noop,
    onCancel: noop,
  }),
  "सही है",
  "फिर बोलें",
);
check(
  "voice recording",
  h(VP, {
    voice: {
      status: "recording",
      target: "answer",
      transcript: "",
      level: 0.5,
      seconds: 3,
      error: "",
    },
    target: "answer",
    heardText: "",
    onHeardTextChange: noop,
    onConfirm: noop,
    onRetry: noop,
    onCancel: noop,
  }),
  "3 / 20",
  'aria-valuenow="50"',
);
check(
  "voice error",
  h(VP, {
    voice: {
      status: "error",
      target: "answer",
      transcript: "",
      level: 0,
      seconds: 0,
      error: "त्रुटि",
    },
    target: "answer",
    heardText: "",
    onHeardTextChange: noop,
    onConfirm: noop,
    onRetry: noop,
    onCancel: noop,
  }),
  "त्रुटि",
);
check(
  "companion",
  h(await load("/src/components/Companion.jsx"), {
    speaking: true,
    listening: false,
    progress: 2,
    onToggleSpeech: noop,
  }),
  "आवाज़ रोकें",
  "अभी",
);
check(
  "header",
  h(await load("/src/components/Header.jsx"), {
    audioOn: true,
    onToggleAudio: noop,
    onBrandClick: noop,
  }),
  "चालू",
);
check(
  "switch dialog",
  h(await load("/src/components/SwitchDialog.jsx"), { open: false, onConfirm: noop, onStay: noop }),
  "यहीं रहें",
);
let bad = 0;
for (const [n, len, miss] of results) {
  if (miss.length) bad++;
  console.log(miss.length ? "FAIL" : "ok  ", n, len, miss.join(" | "));
}
console.log(bad ? `${bad} FAILED` : `all ${results.length} render checks passed`);
await server.close();
process.exit(bad ? 1 : 0);
