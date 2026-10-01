import { useCallback, useEffect, useRef, useState } from "react";

const REQUEST_TIMEOUT_MS = 25000;

/**
 * State and network logic for the "ask for help" dialog.
 * Late replies from an aborted or superseded request are ignored.
 */
export function useGuide({ schemeId, scheme, buildContext, speak, silence }) {
  const [open, setOpen] = useState(false);
  const [teachback, setTeachback] = useState(false);
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState(null);
  const [busy, setBusy] = useState(false);
  const [configured, setConfigured] = useState(false);
  const request = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : {}))
      .then((r) => setConfigured(Boolean(r.geminiConfigured)))
      .catch(() => {});
    return () => request.current?.abort();
  }, []);

  const abort = useCallback(() => {
    request.current?.abort();
    request.current = null;
    setBusy(false);
  }, []);

  const openGuide = useCallback(
    ({ practice = false, question = "" } = {}) => {
      silence?.();
      trigger.current = document.activeElement;
      setTeachback(practice);
      setQuery(question);
      setReply(null);
      setOpen(true);
      if (practice)
        speak(
          `अब आप बताइए. ${scheme.authority} जाते समय आप कौन से कागज़ ले जाएँगी? बोलकर या लिखकर बताइए.`,
        );
    },
    [silence, scheme.authority, speak],
  );

  const close = useCallback(() => {
    abort();
    setOpen(false);
    trigger.current?.focus();
  }, [abort]);

  /** Clears everything, used when the whole journey restarts. */
  const reset = useCallback(() => {
    abort();
    setOpen(false);
    setReply(null);
    setQuery("");
  }, [abort]);

  async function ask(text = query) {
    if (!text.trim() || busy) return;
    silence?.();
    setQuery(text);
    setBusy(true);
    setReply(null);
    const controller = new AbortController();
    request.current = controller;
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const show = (data) => {
      setReply(data);
      speak(data.answer);
    };
    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemeId,
          question: text,
          context: buildContext(teachback),
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("unavailable");
      const data = await response.json();
      if (typeof data.answer !== "string") throw new Error("invalid");
      if (request.current === controller) show(data);
    } catch {
      if (request.current === controller)
        show({
          answer: `अभी सवाल का जवाब नहीं मिला। आपकी तैयारी जारी रह सकती है। सही जानकारी ${scheme.authority} से जाँचें।`,
          mode: "unavailable",
          sourceUrl: scheme.source,
        });
    } finally {
      clearTimeout(timer);
      if (request.current === controller) setBusy(false);
    }
  }

  return {
    open,
    teachback,
    query,
    setQuery,
    reply,
    busy,
    configured,
    openGuide,
    close,
    reset,
    abort,
    ask,
  };
}
