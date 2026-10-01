import { Check, CircleCheck, HelpCircle, Home, Volume2, X } from "lucide-react";
import ItemIcon from "../components/ItemIcon.jsx";

const MARKS = [
  ["ready", "है", Check],
  ["missing", "नहीं है", X],
  ["unsure", "पता नहीं", HelpCircle],
];

export default function DocumentsScreen({
  headingRef,
  scheme,
  documents,
  onMark,
  onSpeak,
  onFinish,
}) {
  return (
    <>
      <span className="section-kicker">कागज़ों की तैयारी</span>
      <h1 className="question-title" ref={headingRef} tabIndex={-1}>
        आपके पास क्या-क्या है?
      </h1>
      <p className="lead compact">
        कागज़ की फोटो भेजने की ज़रूरत नहीं।
        <br />
        बस बताइए — है, नहीं है, या पता नहीं।
      </p>
      <div className="document-list">
        {scheme.documents.map((d) => (
          <article
            className={`document-card ${documents[d.id] === "ready" ? "ready" : ""}`}
            key={d.id}
          >
            <div className="doc-heading">
              <span className="doc-icon">
                <ItemIcon name={d.icon} size={24} />
              </span>
              <h2>{d.title}</h2>
              <button
                className="icon-button"
                onClick={() => onSpeak(`${d.title}. ${d.detail}`)}
                aria-label={`${d.title} के बारे में सुनें`}
              >
                <Volume2 size={21} />
              </button>
            </div>
            <p>{d.detail}</p>
            <div className="doc-options" role="group" aria-label={d.title}>
              {MARKS.map(([value, label, Icon]) => (
                <button
                  key={value}
                  aria-pressed={documents[d.id] === value}
                  className={documents[d.id] === value ? "selected" : ""}
                  onClick={() => onMark(d.id, value)}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="info-note">
        <Home size={22} />
        <p>{scheme.note}</p>
      </div>
      <button className="primary" onClick={onFinish}>
        <CircleCheck size={22} /> मेरी तैयारी की सूची बनाएँ
      </button>
    </>
  );
}
