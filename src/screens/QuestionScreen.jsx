import { Check, HelpCircle, Volume2, X } from "lucide-react";
import { TRADES } from "../../shared/schemes.js";
import ItemIcon from "../components/ItemIcon.jsx";
import VoiceButton from "../components/VoiceButton.jsx";

const CHOICES = [
  { value: "yes", className: "yes", label: "हाँ", Icon: Check, size: 27 },
  { value: "no", className: "no", label: "नहीं", Icon: X, size: 25 },
  {
    value: "unknown",
    className: "unsure",
    label: "पता नहीं",
    Icon: HelpCircle,
    size: 25,
  },
];

export default function QuestionScreen({
  headingRef,
  question,
  index,
  total,
  answer,
  onChoose,
  voice,
  onListen,
  voicePanel,
  onSpeak,
}) {
  return (
    <>
      <span className="section-kicker">
        सवाल {index + 1} / {total}
      </span>
      <div className="question-symbol">
        <ItemIcon name={question.icon} size={31} />
      </div>
      <h1 className="question-title" ref={headingRef} tabIndex={-1}>
        {question.title}
      </h1>
      <p className="lead question-hint">{question.hint}</p>
      {question.id === "coveredTrade" && (
        <details className="trade-list">
          <summary>18 कामों की सूची देखें</summary>
          <p>{TRADES.join(" · ")}</p>
          <button
            className="secondary"
            onClick={() => onSpeak(TRADES.join("। "))}
          >
            <Volume2 size={18} /> सूची सुनें
          </button>
        </details>
      )}
      <div className="answer-options">
        {CHOICES.map(({ value, className, label, Icon, size }) => (
          <button
            key={value}
            className={`choice ${className} ${answer === value ? "selected" : ""}`}
            onClick={() => onChoose(value)}
          >
            <span>
              <Icon size={size} />
            </span>
            {label}
          </button>
        ))}
      </div>
      <VoiceButton
        voice={voice}
        className="voice-answer"
        iconSize={23}
        onClick={onListen}
      />
      {voicePanel}
      <p className="voice-consent">
        बोलने पर आवाज़ लिखने के लिए Gemini तक जाएगी। निजी नंबर न बोलें।
      </p>
      <p className="micro-hint">कुछ समझ न आए तो नीचे “मदद चाहिए” दबाएँ।</p>
    </>
  );
}
