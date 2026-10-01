const READY = "तैयार";
const PENDING = "जाँच / तैयारी बाकी";
const VERIFIED_ON_HI = "1 अक्टूबर 2026";

/** Plain-text preparation list the woman can save and show at the office. */
export function buildChecklistText(scheme, documents) {
  return [
    "ApniBaat — " + scheme.name,
    "",
    "यह तैयारी की सूची है; आवेदन जमा नहीं हुआ है।",
    "",
    ...scheme.documents.map(
      (d) => `${documents[d.id] === "ready" ? READY : PENDING}: ${d.title}\n${d.detail}`,
    ),
    "",
    scheme.handoff,
    scheme.note,
    "सरकारी जानकारी: " + scheme.source,
    "और जानकारी: " + scheme.faq,
    "जानकारी देखी गई: " + VERIFIED_ON_HI,
  ].join("\n");
}

export function checklistFilename(schemeId) {
  return `ApniBaat-${schemeId}-Checklist.txt`;
}

/** Triggers a browser download. The BOM keeps Devanagari readable in Notepad. */
export function downloadText(filename, text) {
  const url = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
