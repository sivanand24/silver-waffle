import { useCallback, useEffect, useRef, useState } from "react";

const isHindi = (voice) => voice.lang.replace("_", "-").toLowerCase().startsWith("hi");

/**
 * Hindi text-to-speech with stale-callback protection.
 *
 * `isBlocked` lets the caller veto speech (for example while the microphone is
 * open) and `onNotice` receives user-facing Hindi failures. Both are read
 * through a ref, so `speak`/`stop` keep a stable identity across renders.
 */
export function useSpeech({ enabled, isBlocked, onNotice }) {
  const [speaking, setSpeaking] = useState(false);
  const utterance = useRef(null);
  const hindiVoice = useRef(null);
  const latest = useRef({ enabled, isBlocked, onNotice });
  useEffect(() => {
    latest.current = { enabled, isBlocked, onNotice };
  });

  useEffect(() => {
    const synth = window.speechSynthesis;
    // Voices load asynchronously in Chrome; cache the Hindi one once.
    const pickVoice = () => {
      hindiVoice.current = synth?.getVoices().find(isHindi) || null;
    };
    pickVoice();
    synth?.addEventListener?.("voiceschanged", pickVoice);
    return () => {
      synth?.removeEventListener?.("voiceschanged", pickVoice);
      utterance.current = null;
      synth?.cancel();
    };
  }, []);

  const stop = useCallback(() => {
    utterance.current = null;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text, force = false) => {
    const { enabled, isBlocked, onNotice } = latest.current;
    if (!enabled && !force) return;
    const synth = window.speechSynthesis;
    if (!synth) {
      onNotice?.("इस ब्राउज़र पर आवाज़ उपलब्ध नहीं है. आप नीचे के बड़े बटन इस्तेमाल कर सकती हैं.");
      return;
    }
    if (isBlocked?.()) return; // never talk over the microphone
    synth.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    utterance.current = speech;
    speech.lang = "hi-IN";
    speech.rate = 0.9;
    speech.pitch = 1;
    if (hindiVoice.current) speech.voice = hindiVoice.current;
    const current = () => utterance.current === speech;
    speech.onstart = () => current() && setSpeaking(true);
    speech.onend = () => current() && setSpeaking(false);
    speech.onerror = (e) => {
      if (!current()) return;
      setSpeaking(false);
      if (e.error !== "interrupted" && e.error !== "canceled")
        onNotice?.("हिंदी आवाज़ नहीं चल पाई. नीचे लिखे सवाल और बड़े बटन से आगे बढ़ें.");
    };
    // Chrome drops speak() issued in the same tick as cancel().
    setTimeout(() => current() && synth.speak(speech), 60);
  }, []);

  return { speaking, speak, stop };
}
