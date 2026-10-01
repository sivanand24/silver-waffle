import { Check, FileText, Headphones, Mic } from "lucide-react";

export default function WelcomeScreen({ headingRef, scheme, onStart, onExplain }) {
  return (
    <>
      <span className="section-kicker">आज की शुरुआत, आपके नाम</span>
      <h1 ref={headingRef} tabIndex={-1}>
        {scheme.headline}
        <br />
        <span>अपने दम पर।</span>
      </h1>
      <p className="lead">
        {scheme.description}
        <br />
        मैं आपको आसान हिंदी में तैयारी बताऊँगी।
      </p>
      <div className="welcome-points">
        <div>
          <Headphones size={22} />
          <span>सुनिए और बोलिए</span>
        </div>
        <div>
          <FileText size={22} />
          <span>अपने कागज़ जानिए</span>
        </div>
      </div>
      <button className="primary start-button" onClick={onStart}>
        <Mic size={23} /> हाँ, मदद चाहिए
      </button>
      <button className="secondary welcome-secondary" onClick={onExplain}>
        पहले योजना समझाइए
      </button>
      <p className="reassurance">
        <Check size={16} /> कोई खाता बनाने की ज़रूरत नहीं
      </p>
      <div className="welcome-footnote">
        <span className="little-flower">✳</span>
        <p>
          आपकी रफ़्तार, आपका फ़ैसला।
          <br />
          <strong>जल्दी नहीं है। हम साथ हैं।</strong>
        </p>
      </div>
    </>
  );
}
