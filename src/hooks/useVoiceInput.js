import { useCallback, useEffect, useRef, useState } from "react";
import { createVoiceRecorder } from "../voice/recorder.js";

const INITIAL = {
  status: "idle",
  target: "answer",
  transcript: "",
  level: 0,
  seconds: 0,
  error: "",
};
const BUSY = new Set(["permission", "recording", "transcribing"]);

/**
 * React binding for the framework-free recorder in `voice/recorder.js`.
 * `onTranscript({ transcript, target })` fires once when a transcript is ready
 * for review.
 */
export function useVoiceInput({ onTranscript } = {}) {
  const controller = useRef(null);
  const busy = useRef(false);
  const lastStatus = useRef("idle");
  const [voice, setVoice] = useState(INITIAL);
  const notify = useRef(onTranscript);
  useEffect(() => {
    notify.current = onTranscript;
  });

  useEffect(() => {
    controller.current = createVoiceRecorder({
      onChange: (next) => {
        busy.current = BUSY.has(next.status);
        const arrived = next.status === "review" && lastStatus.current !== "review";
        lastStatus.current = next.status;
        setVoice(next);
        if (arrived) notify.current?.(next);
      },
      getUserMedia: navigator.mediaDevices?.getUserMedia?.bind(navigator.mediaDevices),
      Recorder: window.MediaRecorder,
      AudioContextClass: window.AudioContext || window.webkitAudioContext,
    });
    return () => controller.current?.destroy();
  }, []);

  const start = useCallback((target) => controller.current?.start(target), []);
  const cancel = useCallback(() => {
    controller.current?.cancel();
    busy.current = false;
  }, []);
  /** Ref-backed so speech can check it without re-rendering. */
  const isBusy = useCallback(() => busy.current, []);

  return {
    voice,
    listening: voice.status === "recording",
    start,
    cancel,
    isBusy,
  };
}
