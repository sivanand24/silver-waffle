import { getQuestions, schemeAssessment } from "../shared/schemes.js";

/**
 * Pure transition for answering one question.
 *
 * - Answers to every later question are discarded, so going back and changing
 *   an earlier answer can never leave a stale dependent answer behind.
 * - A blocking answer (`stopOn`, or an assessment that already says "stop")
 *   jumps straight to the assessment instead of asking pointless questions.
 *
 * @returns {{ answers: object, screen: "questions" | "assessment", questionIndex: number }}
 */
export function answerQuestion({
  scheme,
  answers,
  question,
  value,
  questionIndex,
}) {
  const nextAnswers = { ...answers, [question.id]: value };
  const fullIndex = scheme.questions.findIndex((q) => q.id === question.id);
  for (const later of scheme.questions.slice(fullIndex + 1))
    delete nextAnswers[later.id];

  const blocked =
    question.stopOn === value ||
    schemeAssessment(scheme.id, nextAnswers).kind === "stop";
  const total = getQuestions(scheme.id, nextAnswers).length;
  const finished = blocked || questionIndex >= total - 1;

  return {
    answers: nextAnswers,
    screen: finished ? "assessment" : "questions",
    questionIndex: finished ? questionIndex : questionIndex + 1,
  };
}

/** Screen to show when the user presses "back". */
export function previousStep(screen, questionIndex) {
  if (screen === "questions")
    return questionIndex
      ? { screen, questionIndex: questionIndex - 1 }
      : { screen: "welcome", questionIndex };
  if (screen === "assessment") return { screen: "questions", questionIndex };
  if (screen === "documents") return { screen: "assessment", questionIndex };
  return { screen: "documents", questionIndex };
}

/** Which of the three journey steps (1-3) is active; 0 before the journey. */
export function journeyProgress(screen) {
  if (screen === "select" || screen === "welcome") return 0;
  if (screen === "questions" || screen === "assessment") return 1;
  if (screen === "documents") return 2;
  return 3;
}
