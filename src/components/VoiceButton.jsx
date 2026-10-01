import { Mic } from "lucide-react";

const LABELS = {
  permission: "माइक की अनुमति… रद्द करें",
  recording: "बोल लिया — अब रोकें",
  transcribing: "लिख रही हूँ…",
};

/** Microphone toggle shared by the question screen and the help dialog. */
export default function VoiceButton({ voice, onClick, className, iconSize }) {
  const recording = voice.status === "recording";
  return (
    <button
      type="button"
      className={`${className} ${recording ? "recording" : ""}`}
      disabled={voice.status === "transcribing"}
      onClick={onClick}
    >
      <Mic size={iconSize} />
      {LABELS[voice.status] || "बोलकर जवाब दें"}
    </button>
  );
}
