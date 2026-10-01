/** What the assistant says aloud for each screen. Pure, so it can be tested. */
export function screenSpeech({ screen, scheme, question, assessment, summary }) {
  switch (screen) {
    case "select":
      return "नमस्ते. अपनी बात में आपका स्वागत है. गैस कनेक्शन, बैंक खाता, या कारीगर सहायता में से एक चुनिए. हर रास्ते की जानकारी हिंदी में मिलेगी.";
    case "welcome":
      return `${scheme.name} की तैयारी में मैं आपकी मदद करूँगी. शुरू करने के लिए हाँ, मदद चाहिए वाला बटन दबाएँ.`;
    case "questions":
      return `${question.title} ${question.hint} आप हाँ, नहीं, या पता नहीं चुन सकती हैं.`;
    case "assessment":
      return `${assessment.title} ${assessment.message}`;
    case "documents":
      return "अब कागज़ों को एक एक करके देखें. जो आपके पास है, उसके लिए है चुनें. नहीं है तो नहीं है चुनें. आधार या बैंक का नंबर यहाँ न लिखें.";
    default:
      return `आपकी तैयारी की सूची बन गई है. ${summary.ready.length} तरह के कागज़ तैयार हैं. ${summary.remaining.length} की तैयारी या जाँच बाकी है. आवेदन अभी जमा नहीं हुआ है. ${scheme.handoff}`;
  }
}

/** Read the transcript back so a user who cannot read well can still confirm it. */
export function transcriptReadback(transcript, target = "answer") {
  const next =
    target === "guide"
      ? "ठीक हो तो जवाब बताएँ दबाएँ."
      : "अगर यह सही है, तो सही है दबाएँ. नहीं तो फिर बोलें.";
  return `आपने कहा: ${transcript}. ${next}`;
}
