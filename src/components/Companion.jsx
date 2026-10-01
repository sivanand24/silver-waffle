import {
  Check,
  HeartHandshake,
  Pause,
  ShieldCheck,
  Volume2,
} from "lucide-react";

const STEPS = ["थोड़ी सी जानकारी", "कागज़ों की तैयारी", "आपका अगला कदम"];

function mood(listening, speaking) {
  if (listening) return "मैं सुन रही हूँ…";
  return speaking ? "सुनिए, मैं बताती हूँ…" : "नमस्ते, मैं अपनी बात हूँ।";
}

/** Left panel: the voice orb, a replay button and the three-step progress. */
export default function Companion({
  speaking,
  listening,
  progress,
  onToggleSpeech,
}) {
  return (
    <aside className="companion">
      <div className="companion-top">
        <span className="eyebrow">आपकी अपनी साथी</span>
        <span className="petal-mark">✳</span>
      </div>
      <div
        className={`voice-orb ${speaking || listening ? "is-active" : ""}`}
        aria-hidden="true"
      >
        <div className="orb-ring ring-one" />
        <div className="orb-ring ring-two" />
        <div className="orb-core">
          <HeartHandshake size={52} strokeWidth={1.4} />
        </div>
        <div className="voice-bars">
          {[1, 2, 3, 4, 5].map((i) => (
            <i key={i} style={{ "--i": i }} />
          ))}
        </div>
      </div>
      <div className="companion-copy">
        <h2>{mood(listening, speaking)}</h2>
        <p>
          धीरे-धीरे, एक कदम साथ चलेंगे।
          <br />
          आप कभी भी दोबारा पूछ सकती हैं।
        </p>
      </div>
      <button className="listen-button" onClick={onToggleSpeech}>
        {speaking ? <Pause size={19} /> : <Volume2 size={19} />}{" "}
        {speaking ? "आवाज़ रोकें" : "मेरी बात सुनें"}
      </button>
      <div className="journey" aria-label="आपकी तैयारी के चरण">
        {STEPS.map((label, i) => (
          <div
            className={`journey-step ${progress > i ? "current" : ""}`}
            key={label}
          >
            <span>{progress > i + 1 ? <Check size={15} /> : i + 1}</span>
            <p>{label}</p>
            {progress === i + 1 && <span className="step-here">अभी</span>}
          </div>
        ))}
      </div>
      <div className="private-note">
        <ShieldCheck size={19} />
        <span>
          यहाँ आधार या बैंक का नंबर
          <br />
          नहीं माँगा जाएगा।
        </span>
      </div>
    </aside>
  );
}
