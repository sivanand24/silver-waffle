import { Check, Mic } from "lucide-react";

const ACTIVE = ["permission", "recording", "transcribing"];
const HEADLINE = {
  permission: "ब्राउज़र में माइक की अनुमति दें",
  recording: "सुन रही हूँ… बोलने के बाद रोकें",
  transcribing: "आपकी आवाज़ लिख रही हूँ…",
};

function statusLine(voice) {
  if (voice.status === "recording") return `${voice.seconds} / 20 सेकंड`;
  return voice.status === "permission" ? "माइक की अनुमति" : "एक पल रुकिए";
}

/**
 * Everything the user sees about a voice attempt: permission, level meter,
 * errors, and the editable transcript she must confirm before it is used.
 */
export default function VoicePanel({
  voice,
  target,
  heardText,
  onHeardTextChange,
  onConfirm,
  onRetry,
  onCancel,
}) {
  if (voice.target !== target || voice.status === "idle") return null;
  return (
    <div className="voice-panel">
      {ACTIVE.includes(voice.status) && (
        <div className="live-caption" role="status">
          <div>
            <small>{HEADLINE[voice.status]}</small>
            <p>{statusLine(voice)}</p>
          </div>
          <button className="secondary" onClick={onCancel}>
            रद्द करें
          </button>
        </div>
      )}
      {voice.status === "recording" && (
        <div
          className="mic-level"
          role="meter"
          aria-label="माइक्रोफ़ोन की आवाज़ का स्तर"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(voice.level * 100)}
        >
          <span style={{ width: voice.level * 100 + "%" }} />
        </div>
      )}
      {voice.status === "error" && (
        <p className="notice" role="alert">
          {voice.error}
        </p>
      )}
      {voice.status === "review" && target === "answer" && (
        <div className="transcript-review">
          <label htmlFor="heard-text">आपने कहा… (चाहें तो सुधारें)</label>
          <textarea
            id="heard-text"
            rows={2}
            maxLength={1200}
            value={heardText}
            onChange={(e) => onHeardTextChange(e.target.value)}
          />
          <div className="query-actions">
            <button className="primary" disabled={!heardText.trim()} onClick={onConfirm}>
              <Check size={19} /> सही है
            </button>
            <button className="secondary" onClick={onRetry}>
              <Mic size={19} /> फिर बोलें
            </button>
          </div>
        </div>
      )}
      {voice.status === "review" && target === "guide" && (
        <p className="notice" role="status">
          आपकी बात सवाल के डिब्बे में लिखी है। सुधारकर “जवाब बताएँ” दबाएँ।
        </p>
      )}
    </div>
  );
}
