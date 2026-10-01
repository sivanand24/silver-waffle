import test from "node:test";
import assert from "node:assert/strict";
import { getAssessment, getDocumentSummary, speechChoice } from "./flow.js";
test("existing household LPG blocks the new-connection preparation path", () =>
  assert.equal(getAssessment({ adult: "yes", lpg: "yes", png: "no" }).kind, "stop"));
test("underage and PNG responses never get preparation verdict", () => {
  assert.equal(getAssessment({ adult: "no" }).kind, "stop");
  assert.equal(getAssessment({ adult: "yes", lpg: "no", png: "yes" }).kind, "stop");
});
test("uncertainty is retained instead of interpreted as no LPG", () =>
  assert.equal(getAssessment({ adult: "yes", lpg: "unknown", png: "no" }).kind, "check"));
test("normal path still does not promise approval", () =>
  assert.match(
    getAssessment({ adult: "yes", lpg: "no", png: "no" }).message,
    /पात्रता की पुष्टि नहीं/,
  ));
test("unanswered documents count as remaining", () => {
  const summary = getDocumentSummary({ identity: "ready", family: "missing" });
  assert.equal(summary.ready.length, 1);
  assert.equal(summary.remaining.length, 5);
});
test("spoken uncertain negative and affirmative are distinct", () => {
  assert.equal(speechChoice("मुझे पता नहीं"), "unknown");
  assert.equal(speechChoice("नहीं है"), "no");
  assert.equal(speechChoice("हाँ"), "yes");
  assert.equal(speechChoice("नहीं, मेरे पास नहीं है।"), "no");
  assert.equal(speechChoice("जी, हाँ।"), "yes");
  assert.equal(speechChoice("मेरी माँ का कनेक्शन बंद है"), null);
});
