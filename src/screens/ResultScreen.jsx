import {
  Check,
  Download,
  ExternalLink,
  FileText,
  MessageCircle,
  Mic,
  Phone,
  Volume2,
} from "lucide-react";

export default function ResultScreen({
  headingRef,
  scheme,
  summary,
  onSave,
  onReadList,
  onPractice,
  onSpeak,
}) {
  return (
    <>
      <span className="section-kicker">आपका अगला कदम</span>
      <div className="result-heading">
        <div className="question-symbol">
          <Check size={33} />
        </div>
        <h1 className="question-title" ref={headingRef} tabIndex={-1}>
          अब राह थोड़ी आसान है।
        </h1>
      </div>
      <p className="lead compact">आपकी अपनी तैयारी की सूची बन गई है।</p>
      <div className="readiness-summary">
        <div>
          <strong>{summary.ready.length}</strong>
          <span>कागज़ तैयार</span>
        </div>
        <div>
          <strong>{summary.remaining.length}</strong>
          <span>तैयारी / जाँच बाकी</span>
        </div>
        <span className="summary-icon">
          <FileText size={33} />
        </span>
      </div>
      {summary.remaining.length > 0 && (
        <div className="remaining">
          <h2>अब इनकी तैयारी करें</h2>
          {summary.remaining.map((d) => (
            <div key={d.id}>
              <span className="small-ring" />
              <span>{d.title}</span>
              <button
                className="icon-button"
                onClick={() => onSpeak(d.detail)}
                aria-label={`${d.title} की मदद सुनें`}
              >
                <Volume2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="next-step">
        <span>अगला कदम</span>
        <h2>{scheme.destination}</h2>
        <p>{scheme.handoff}</p>
        <strong>आवेदन अभी जमा नहीं हुआ है।</strong>
      </div>
      <div className="result-actions">
        <button className="primary" onClick={onSave}>
          <Download size={21} /> मेरी सूची सेव करें
        </button>
        <button className="secondary" onClick={onReadList}>
          <Volume2 size={21} /> मेरी सूची सुनाएँ
        </button>
      </div>
      <button className="teachback-card" onClick={onPractice}>
        <span>
          <MessageCircle size={27} />
        </span>
        <div>
          <strong>चलें, एक बार आप बताइए?</strong>
          <small>कौन से कागज़ ले जाएँगी? बोलकर अभ्यास करें।</small>
        </div>
        <Mic size={23} />
      </button>
      <div className="official-actions">
        <a href={scheme.source} target="_blank" rel="noreferrer">
          <ExternalLink size={17} /> सरकारी वेबसाइट खोलें
        </a>
        {scheme.helpline && (
          <a href={"tel:" + scheme.helpline}>
            <Phone size={17} /> सरकारी मदद: {scheme.helpline}
          </a>
        )}
      </div>
    </>
  );
}
