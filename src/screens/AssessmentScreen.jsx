import { BookOpen, FileText, Phone, ShieldCheck } from "lucide-react";

export default function AssessmentScreen({
  headingRef,
  scheme,
  assessment,
  onContinue,
  onExplain,
}) {
  const stopped = assessment.kind === "stop";
  return (
    <>
      <span className="section-kicker">आपके जवाबों के अनुसार</span>
      <div className={`question-symbol ${stopped ? "amber" : ""}`}>
        <BookOpen size={32} />
      </div>
      <h1 className="question-title" ref={headingRef} tabIndex={-1}>
        {assessment.title}
      </h1>
      <p className="lead">{assessment.message}</p>
      {!stopped ? (
        <button className="primary" onClick={onContinue}>
          <FileText size={22} /> मेरे कागज़ देखें
        </button>
      ) : (
        <a
          className="primary"
          href={scheme.helpline ? "tel:" + scheme.helpline : scheme.source}
          target={scheme.helpline ? undefined : "_blank"}
          rel="noreferrer"
        >
          <Phone size={22} />{" "}
          {scheme.helpline ? "सरकारी हेल्पलाइन से बात करें" : "सरकारी जानकारी खोलें"}
        </a>
      )}
      <button className="secondary" onClick={onExplain}>
        मुझे थोड़ा और समझाइए
      </button>
      <div className="info-note">
        <ShieldCheck size={21} />
        <p>यह आवेदन की तैयारी है। अंतिम मंज़ूरी सरकारी प्रक्रिया से होगी।</p>
      </div>
    </>
  );
}
