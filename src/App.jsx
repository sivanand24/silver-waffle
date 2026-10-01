import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, HeartHandshake, MessageCircle } from "lucide-react";
import { speechChoice } from "./flow.js";
import {
  getScheme,
  getQuestions,
  schemeAssessment,
  documentSummary,
} from "../shared/schemes.js";
import { answerQuestion, journeyProgress, previousStep } from "./journey.js";
import { buildChecklistText, checklistFilename, downloadText } from "./checklist.js";
import { screenSpeech, transcriptReadback } from "./speech-text.js";
import { useSpeech } from "./hooks/useSpeech.js";
import { useVoiceInput } from "./hooks/useVoiceInput.js";
import { useGuide } from "./hooks/useGuide.js";
import Header from "./components/Header.jsx";
import Companion from "./components/Companion.jsx";
import Footer from "./components/Footer.jsx";
import GuideDialog from "./components/GuideDialog.jsx";
import SwitchDialog from "./components/SwitchDialog.jsx";
import VoicePanel from "./components/VoicePanel.jsx";
import ItemIcon from "./components/ItemIcon.jsx";
import SelectScreen from "./screens/SelectScreen.jsx";
import WelcomeScreen from "./screens/WelcomeScreen.jsx";
import QuestionScreen from "./screens/QuestionScreen.jsx";
import AssessmentScreen from "./screens/AssessmentScreen.jsx";
import DocumentsScreen from "./screens/DocumentsScreen.jsx";
import ResultScreen from "./screens/ResultScreen.jsx";

/**
 * Owns the journey state machine (which screen, which answers) and wires the
 * speech, microphone and help-dialog hooks to the screens. Presentation lives in
 * `components/` and `screens/`; pure rules live in `journey.js` and `shared/`.
 */
export default function App() {
  const [screen, setScreen] = useState("select");
  const [schemeId, setSchemeId] = useState("ujjwala");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [documents, setDocuments] = useState({});
  const [audioOn, setAudioOn] = useState(true);
  const [switching, setSwitching] = useState(false);
  const [notice, setNotice] = useState("");
  const [heardText, setHeardText] = useState("");
  const heading = useRef(null);
  const started = useRef(false);

  const {
    voice,
    listening,
    start: startVoice,
    cancel: cancelVoice,
    isBusy,
  } = useVoiceInput();
  const { speaking, speak, stop: stopSpeaking } = useSpeech({
    enabled: audioOn,
    isBlocked: isBusy,
    onNotice: setNotice,
  });

  const scheme = getScheme(schemeId);
  // Memoised: the microphone meter re-renders this component while recording.
  const questions = useMemo(() => getQuestions(schemeId, answers), [schemeId, answers]);
  const assessment = useMemo(() => schemeAssessment(schemeId, answers), [schemeId, answers]);
  const summary = useMemo(() => documentSummary(schemeId, documents), [schemeId, documents]);
  const currentQuestion = questions[questionIndex];
  const progress = journeyProgress(screen);

  const silence = useCallback(() => {
    cancelVoice();
    stopSpeaking();
  }, [cancelVoice, stopSpeaking]);

  const guide = useGuide({
    schemeId,
    scheme,
    speak,
    silence,
    buildContext: (practice) => ({
      step: practice
        ? "teachback"
        : screen === "questions"
          ? currentQuestion.id
          : screen,
      answers,
      documents,
    }),
  });

  const screenText = () =>
    screenSpeech({ screen, scheme, question: currentQuestion, assessment, summary });
  const speakScreen = () => speak(screenText(), true);

  // Read each new screen aloud, and move focus to its heading for screen readers.
  useEffect(() => {
    if (!started.current) return;
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    speak(screenText());
  }, [screen, questionIndex]);

  // When a transcript arrives, show it and read it back so she can confirm by ear.
  useEffect(() => {
    if (voice.status !== "review") return;
    setHeardText(voice.transcript);
    if (voice.target === "guide") guide.setQuery(voice.transcript);
    speak(transcriptReadback(voice.transcript, voice.target));
  }, [voice.status, voice.transcript, voice.target]);

  function navigate(next) {
    silence();
    setScreen(next);
  }
  function reset() {
    silence();
    guide.reset();
    started.current = false;
    setScreen("select");
    setQuestionIndex(0);
    setAnswers({});
    setDocuments({});
    setNotice("");
    setSwitching(false);
  }
  function switchScheme() {
    silence();
    if (Object.keys(answers).length) setSwitching(true);
    else reset();
  }
  function selectScheme(id) {
    setSchemeId(id);
    setQuestionIndex(0);
    setAnswers({});
    setDocuments({});
    started.current = true;
    navigate("welcome");
  }
  function start() {
    started.current = true;
    setNotice("");
    navigate("questions");
  }
  function choose(value) {
    silence();
    const step = answerQuestion({
      scheme,
      answers,
      question: currentQuestion,
      value,
      questionIndex,
    });
    setAnswers(step.answers);
    setNotice("");
    setScreen(step.screen);
    setQuestionIndex(step.questionIndex);
  }
  function previous() {
    silence();
    const step = previousStep(screen, questionIndex);
    setScreen(step.screen);
    setQuestionIndex(step.questionIndex);
  }
  function listen(target = "answer") {
    stopSpeaking();
    guide.abort();
    setNotice("");
    startVoice(target);
  }
  function confirmVoice() {
    const text = heardText.trim();
    if (!text) return;
    const choice = speechChoice(text);
    cancelVoice();
    if (screen === "questions" && choice) choose(choice);
    else guide.openGuide({ question: text });
  }
  function toggleAudio() {
    if (audioOn) stopSpeaking();
    else speak(screenText(), true);
    setAudioOn(!audioOn);
  }
  function saveChecklist() {
    downloadText(checklistFilename(schemeId), buildChecklistText(scheme, documents));
    setNotice("आपकी सूची फ़ोन या कंप्यूटर में सेव हो गई है.");
  }
  const speakNow = (text) => speak(text, true);
  const voicePanel = (target) => (
    <VoicePanel
      voice={voice}
      target={target}
      heardText={heardText}
      onHeardTextChange={setHeardText}
      onConfirm={confirmVoice}
      onRetry={() => listen(target)}
      onCancel={cancelVoice}
    />
  );

  return (
    <div className="app-shell">
      <Header
        audioOn={audioOn}
        onToggleAudio={toggleAudio}
        onBrandClick={speakScreen}
      />

      <main className="workspace">
        <Companion
          speaking={speaking}
          listening={listening}
          progress={progress}
          onToggleSpeech={() => (speaking ? stopSpeaking() : speakScreen())}
        />

        <section className="main-panel">
          <div className="panel-top">
            <div className="scheme-label">
              <span>
                <ItemIcon name={scheme.icon} size={17} />
              </span>{" "}
              {screen === "select" ? "हिंदी में आपकी सहायता" : scheme.name}
            </div>
            {!["welcome", "select"].includes(screen) && (
              <button className="text-button" onClick={previous}>
                <ChevronLeft size={17} /> पिछला कदम
              </button>
            )}
          </div>
          {screen !== "select" && (
            <button className="change-scheme" onClick={switchScheme}>
              दूसरी सहायता चुनें
            </button>
          )}
          <div className="screen" key={`${screen}-${questionIndex}`}>
            {screen === "select" && (
              <SelectScreen
                headingRef={heading}
                onSelect={selectScheme}
                onSpeak={speakScreen}
              />
            )}
            {screen === "welcome" && (
              <WelcomeScreen
                headingRef={heading}
                scheme={scheme}
                onStart={start}
                onExplain={() =>
                  guide.openGuide({ question: scheme.shortName + " योजना क्या है?" })
                }
              />
            )}
            {screen === "questions" && (
              <QuestionScreen
                headingRef={heading}
                question={currentQuestion}
                index={questionIndex}
                total={questions.length}
                answer={answers[currentQuestion.id]}
                onChoose={choose}
                voice={voice}
                onListen={() => listen()}
                voicePanel={voicePanel("answer")}
                onSpeak={speakNow}
              />
            )}
            {screen === "assessment" && (
              <AssessmentScreen
                headingRef={heading}
                scheme={scheme}
                assessment={assessment}
                onContinue={() => navigate("documents")}
                onExplain={() =>
                  guide.openGuide({
                    question: "मेरे जवाबों के अनुसार अगला सही कदम क्या है?",
                  })
                }
              />
            )}
            {screen === "documents" && (
              <DocumentsScreen
                headingRef={heading}
                scheme={scheme}
                documents={documents}
                onMark={(id, value) => setDocuments((prev) => ({ ...prev, [id]: value }))}
                onSpeak={speakNow}
                onFinish={() => navigate("result")}
              />
            )}
            {screen === "result" && (
              <ResultScreen
                headingRef={heading}
                scheme={scheme}
                summary={summary}
                onSave={saveChecklist}
                onReadList={() =>
                  speak(
                    screenText() +
                      " " +
                      summary.remaining.map((d) => d.title).join("। "),
                    true,
                  )
                }
                onPractice={() => guide.openGuide({ practice: true })}
                onSpeak={speakNow}
              />
            )}
          </div>
          {notice && (
            <div className="notice" role="status">
              {notice}
            </div>
          )}
          <div className="help-bar">
            <span>
              <HeartHandshake size={19} /> समझ न आए, तो पूछिए।
            </span>
            <button
              onClick={() =>
                screen === "select" ? speakScreen() : guide.openGuide()
              }
            >
              <MessageCircle size={19} /> मदद चाहिए
            </button>
          </div>
        </section>
      </main>

      <Footer
        scheme={scheme}
        showRestart={screen !== "select"}
        onRestart={switchScheme}
      />

      <GuideDialog
        open={guide.open}
        onClose={guide.close}
        teachback={guide.teachback}
        scheme={scheme}
        configured={guide.configured}
        busy={guide.busy}
        query={guide.query}
        onQueryChange={guide.setQuery}
        onAsk={guide.ask}
        reply={guide.reply}
        voice={voice}
        voicePanel={voicePanel("guide")}
        onListen={() => listen("guide")}
        onSpeak={speakNow}
        notice={notice}
      />
      <SwitchDialog
        open={switching}
        onConfirm={reset}
        onStay={() => setSwitching(false)}
      />
    </div>
  );
}
