import test from "node:test";
import assert from "node:assert/strict";
import { getScheme, getQuestions, documentSummary } from "../shared/schemes.js";
import { answerQuestion, previousStep, journeyProgress } from "./journey.js";
import { buildChecklistText, checklistFilename } from "./checklist.js";
import { screenSpeech, transcriptReadback } from "./speech-text.js";

const ujjwala = getScheme("ujjwala");
const ask = (scheme, answers, id, value, questionIndex = 0) =>
  answerQuestion({
    scheme,
    answers,
    question: scheme.questions.find((q) => q.id === id),
    value,
    questionIndex,
  });

test("a blocking answer jumps straight to the assessment", () => {
  const step = ask(ujjwala, {}, "adult", "no");
  assert.equal(step.screen, "assessment");
  assert.equal(step.answers.adult, "no");
});

test("a normal answer advances to the next question", () => {
  const step = ask(ujjwala, {}, "adult", "yes");
  assert.deepEqual(
    [step.screen, step.questionIndex],
    ["questions", 1],
  );
});

test("changing an earlier answer drops every later answer", () => {
  const step = ask(
    ujjwala,
    { adult: "yes", lpg: "no", png: "no", declaration: "yes" },
    "lpg",
    "unknown",
    1,
  );
  assert.deepEqual(Object.keys(step.answers).sort(), ["adult", "lpg"]);
});

test("the last question ends on the assessment", () => {
  const total = getQuestions("ujjwala", {}).length;
  const step = ask(ujjwala, { adult: "yes", lpg: "no", png: "no" }, "declaration", "yes", total - 1);
  assert.equal(step.screen, "assessment");
});

test("conditional artisan question appears only after a prior loan", () => {
  const vishwakarma = getScheme("vishwakarma");
  const base = { adult: "yes", artisan: "yes", coveredTrade: "yes", familyMember: "no", governmentJob: "no" };
  const before = getQuestions("vishwakarma", { ...base, similarLoan: "no" }).length;
  const after = getQuestions("vishwakarma", { ...base, similarLoan: "yes" }).length;
  assert.equal(after, before + 1);
  assert.ok(vishwakarma.questions.length >= after);
});

test("back navigation walks the journey in reverse", () => {
  assert.deepEqual(previousStep("questions", 2), { screen: "questions", questionIndex: 1 });
  assert.equal(previousStep("questions", 0).screen, "welcome");
  assert.equal(previousStep("assessment", 1).screen, "questions");
  assert.equal(previousStep("documents", 1).screen, "assessment");
  assert.equal(previousStep("result", 1).screen, "documents");
});

test("progress maps screens to the three visible steps", () => {
  assert.deepEqual(
    ["select", "welcome", "questions", "assessment", "documents", "result"].map(journeyProgress),
    [0, 0, 1, 1, 2, 3],
  );
});

test("checklist marks ready papers and never claims submission", () => {
  const text = buildChecklistText(ujjwala, { identity: "ready" });
  assert.match(text, /^ApniBaat — /);
  assert.match(text, /तैयार: आधार की प्रतियाँ/);
  assert.match(text, /जाँच \/ तैयारी बाकी: परिवार का कागज़/);
  assert.match(text, /आवेदन जमा नहीं हुआ है/);
  assert.equal(checklistFilename("ujjwala"), "ApniBaat-ujjwala-Checklist.txt");
});

test("spoken text covers every screen and reads the transcript back", () => {
  const summary = documentSummary("ujjwala", { identity: "ready" });
  const base = { scheme: ujjwala, question: ujjwala.questions[0], assessment: { title: "यह एक जाँच का शीर्षक है.", message: "यह एक जाँच का संदेश है." }, summary };
  for (const screen of ["select", "welcome", "questions", "assessment", "documents", "result"])
    assert.ok(screenSpeech({ ...base, screen }).length > 20, screen);
  assert.match(screenSpeech({ ...base, screen: "result" }), /1 तरह के कागज़ तैयार/);
  assert.match(transcriptReadback("हाँ"), /आपने कहा: हाँ.*सही है दबाएँ/);
  assert.match(transcriptReadback("हाँ", "guide"), /जवाब बताएँ दबाएँ/);
});
