import { useState } from "react";
import { ExternalLink, RotateCcw, ShieldCheck } from "lucide-react";

/** Trust footer plus the expandable "where does this information come from". */
export default function Footer({ scheme, showRestart, onRestart }) {
  const [sourcesOpen, setSourcesOpen] = useState(false);
  return (
    <>
      <footer className="footer">
        <div>
          <ShieldCheck size={16} />
          <span>सरकारी जानकारी पर आधारित · स्वतंत्र सहायता, सरकारी वेबसाइट नहीं</span>
        </div>
        <div>
          <button onClick={() => setSourcesOpen(!sourcesOpen)} aria-expanded={sourcesOpen}>
            जानकारी का स्रोत
          </button>
          {showRestart && (
            <button onClick={onRestart}>
              <RotateCcw size={14} /> फिर से शुरू करें
            </button>
          )}
        </div>
      </footer>
      {sourcesOpen && (
        <section className="sources">
          <h2>हमारी जानकारी कहाँ से आती है?</h2>
          <p>
            {scheme.name} की जानकारी 1 अक्टूबर 2026 को आधिकारिक स्रोत से जाँची गई। नियम बदल सकते
            हैं। अंतिम पुष्टि {scheme.authority} करेगा।
          </p>
          <a href={scheme.source} target="_blank" rel="noreferrer">
            आवेदन और कागज़ों की सरकारी जानकारी <ExternalLink size={14} />
          </a>
          <a href={scheme.faq} target="_blank" rel="noreferrer">
            सरकारी सवाल-जवाब <ExternalLink size={14} />
          </a>
          <p>
            आपकी रिकॉर्ड की हुई आवाज़ लिखने के लिए Gemini तक जाती है। ऐप रिकॉर्डिंग या सवालों को सेव
            नहीं करता। पूछे गए सवाल भी AI सेवा तक जा सकते हैं। आधार, बैंक नंबर या दूसरी निजी जानकारी
            यहाँ न लिखें या बोलें।
          </p>
        </section>
      )}
    </>
  );
}
