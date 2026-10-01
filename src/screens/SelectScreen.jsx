import { Volume2 } from "lucide-react";
import { SCHEMES } from "../../shared/schemes.js";
import ItemIcon from "../components/ItemIcon.jsx";

export default function SelectScreen({ headingRef, onSelect, onSpeak }) {
  return (
    <>
      <span className="section-kicker">आपको किस काम में मदद चाहिए?</span>
      <h1 ref={headingRef} tabIndex={-1}>
        अपनी बात कहिए,
        <br />
        <span>अपना रास्ता चुनिए।</span>
      </h1>
      <p className="lead">एक काम चुनें। मैं हर कदम आसान हिंदी में बताऊँगी।</p>
      <div className="scheme-picker">
        {Object.values(SCHEMES).map((item) => (
          <button key={item.id} onClick={() => onSelect(item.id)}>
            <span className="doc-icon">
              <ItemIcon name={item.icon} size={27} />
            </span>
            <div>
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </div>
          </button>
        ))}
      </div>
      <button className="secondary" onClick={onSpeak}>
        <Volume2 size={21} /> ये विकल्प सुनाएँ
      </button>
    </>
  );
}
