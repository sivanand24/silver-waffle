import { useEffect, useRef } from "react";
import {
  ExternalLink,
  HeartHandshake,
  LoaderCircle,
  Send,
  ShieldCheck,
  Volume2,
  X,
} from "lucide-react";
import VoiceButton from "./VoiceButton.jsx";

const REPLY_LABEL = {
  live: "ApniBaat का जवाब",
  offline: "सहेजी गई जानकारी",
};

/** The "ask a question" dialog: typed or spoken, answered from reviewed content. */
export default function GuideDialog({
  open,
  onClose,
  teachback,
  scheme,
  configured,
  busy,
  query,
  onQueryChange,
  onAsk,
  reply,
  voice,
  voicePanel,
  onListen,
  onSpeak,
  notice,
}) {
  const dialog = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      input.current?.focus();
    } else dialog.current?.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="guide-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
      aria-labelledby="guide-title"
    >
      <div className="dialog-body">
        <div className="dialog-header">
          <span className="dialog-icon">
            <HeartHandshake size={28} />
          </span>
          <div>
            <h2 id="guide-title">{teachback ? "एक छोटा-सा अभ्यास" : "पूछिए, मैं साथ हूँ।"}</h2>
            <p>{configured ? "ApniBaat · AI की मदद से" : "ApniBaat · सहेजी गई जानकारी"}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="मदद बंद करें">
            <X size={23} />
          </button>
        </div>
        <p className="dialog-intro">
          {teachback
            ? scheme.authority + " जाते समय आप कौन से कागज़ साथ ले जाएँगी? अपने शब्दों में बताइए।"
            : "अपना सवाल बोलकर या आसान शब्दों में लिखकर पूछिए।"}
        </p>
        {!teachback && (
          <div className="suggestions">
            {scheme.suggestions.map((q) => (
              <button key={q} disabled={busy} onClick={() => onAsk(q)}>
                {q}
              </button>
            ))}
          </div>
        )}
        {voicePanel}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAsk();
          }}
        >
          <label htmlFor="question-input">{teachback ? "आपका जवाब" : "आपका सवाल"}</label>
          <textarea
            id="question-input"
            ref={input}
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            maxLength={1200}
            placeholder={teachback ? "मैं अपने साथ…" : "यहाँ लिखिए…"}
            rows={3}
          />
          <div className="query-actions">
            <VoiceButton voice={voice} className="secondary" iconSize={21} onClick={onListen} />
            <button className="primary" disabled={!query.trim() || busy} type="submit">
              {busy ? <LoaderCircle size={21} className="spin" /> : <Send size={19} />}{" "}
              {busy ? "एक पल…" : teachback ? "मेरा जवाब देखें" : "जवाब बताएँ"}
            </button>
          </div>
        </form>
        {reply && (
          <div className="reply" role="status">
            <div>
              <span>{REPLY_LABEL[reply.mode] || "अभी संपर्क नहीं हुआ"}</span>
              <button
                className="icon-button"
                aria-label="जवाब सुनें"
                onClick={() => onSpeak(reply.answer)}
              >
                <Volume2 size={21} />
              </button>
            </div>
            <p>{reply.answer}</p>
            {reply.mode === "offline" && (
              <small>अभी AI से बात नहीं हुई। यह पहले से जाँची हुई सामान्य जानकारी है।</small>
            )}
            <a href={reply.sourceUrl || scheme.source} target="_blank" rel="noreferrer">
              सरकारी स्रोत देखें <ExternalLink size={14} />
            </a>
          </div>
        )}
        {notice && (
          <p className="dialog-notice" role="status">
            {notice}
          </p>
        )}
        <p className="privacy-line">
          <ShieldCheck size={15} /> आधार या बैंक का नंबर यहाँ न लिखें।
        </p>
      </div>
    </dialog>
  );
}
