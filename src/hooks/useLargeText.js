import { useEffect, useState } from "react";

const KEY = "apnibaat-large-text";

function readSaved() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false; // storage blocked (private mode); the toggle still works
  }
}

/** Large-text preference, remembered between visits and applied to <html>. */
export function useLargeText() {
  const [large, setLarge] = useState(readSaved);
  useEffect(() => {
    document.documentElement.classList.toggle("large-text", large);
    try {
      localStorage.setItem(KEY, large ? "1" : "0");
    } catch {
      /* preference just will not persist */
    }
  }, [large]);
  return [large, () => setLarge((value) => !value)];
}
