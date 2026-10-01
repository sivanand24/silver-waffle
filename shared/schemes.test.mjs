import test from "node:test";
import assert from "node:assert/strict";
import { getScheme, getQuestions, schemeAssessment, documentSummary, SCHEMES } from "./schemes.js";
import { answerQuestion, validateBody } from "../api/guide.mjs";
test("Jan Dhan avoids duplicate adult accounts and retains uncertainty", () => {
  assert.equal(schemeAssessment("jandhan", { adult: "yes", hasAccount: "yes" }).kind, "stop");
  assert.equal(schemeAssessment("jandhan", { adult: "yes", hasAccount: "unknown" }).kind, "check");
  assert.equal(schemeAssessment("jandhan", { adult: "yes", hasAccount: "no" }).kind, "prepare");
  assert.equal(schemeAssessment("jandhan", {}).kind, "check");
});
const artisan = {
  adult: "yes",
  artisan: "yes",
  coveredTrade: "yes",
  familyMember: "no",
  governmentJob: "no",
  similarLoan: "no",
};
test("artisan gates and repaid-loan exception are conditional", () => {
  assert.equal(schemeAssessment("vishwakarma", artisan).kind, "prepare");
  for (const patch of [
    { adult: "no" },
    { artisan: "no" },
    { coveredTrade: "no" },
    { familyMember: "yes" },
    { governmentJob: "yes" },
    { similarLoan: "yes", repaidException: "no" },
  ])
    assert.equal(schemeAssessment("vishwakarma", { ...artisan, ...patch }).kind, "stop");
  assert.equal(
    schemeAssessment("vishwakarma", {
      ...artisan,
      similarLoan: "yes",
      repaidException: "yes",
    }).kind,
    "prepare",
  );
  assert.equal(
    schemeAssessment("vishwakarma", { ...artisan, similarLoan: "unknown" }).kind,
    "check",
  );
  assert.equal(
    getQuestions("vishwakarma", artisan).some((q) => q.id === "repaidException"),
    false,
  );
  assert.equal(
    getQuestions("vishwakarma", { ...artisan, similarLoan: "yes" }).some(
      (q) => q.id === "repaidException",
    ),
    true,
  );
});
test("each scheme has a separate source, checklist and teachback", async () => {
  for (const id of Object.keys(SCHEMES)) {
    assert.equal(documentSummary(id, {}).remaining.length, getScheme(id).documents.length);
    const result = await answerQuestion(
      { schemeId: id, question: "कौन से कागज़ चाहिए?" },
      { env: {} },
    );
    assert.equal(result.sourceUrl, getScheme(id).source);
    const teachback = await answerQuestion(
      {
        schemeId: id,
        question: "मैं आधार ले जाऊँगी",
        context: { step: "teachback" },
      },
      { env: {} },
    );
    if (id !== "ujjwala") assert.doesNotMatch(teachback.answer, /गैस एजेंसी|उज्ज्वला/);
  }
});
test("explicit other-scheme requests cannot silently switch context", async () => {
  const result = await answerQuestion(
    { schemeId: "jandhan", question: "उज्ज्वला योजना क्या है?" },
    {
      env: { GEMINI_API_KEY: "test" },
      fetch: () => {
        throw Error("must not call");
      },
    },
  );
  assert.match(result.answer, /दूसरी सहायता चुनें/);
  assert.equal(result.mode, "offline");
});
test("invalid and prototype scheme identifiers are rejected; legacy requests default correctly", () => {
  for (const schemeId of ["constructor", "__proto__", "unknown", {}])
    assert.throws(() => validateBody({ schemeId, question: "hello" }));
  assert.equal(validateBody({ question: "hello" }).schemeId, "ujjwala");
});
