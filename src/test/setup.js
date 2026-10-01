import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/** What the app asked the browser to say aloud, in order. */
export const spoken = [];

class FakeUtterance {
  constructor(text) {
    this.text = text;
  }
}

beforeEach(() => {
  spoken.length = 0;
  window.scrollTo = vi.fn();
  window.SpeechSynthesisUtterance = FakeUtterance;
  window.speechSynthesis = {
    getVoices: () => [],
    cancel: vi.fn(),
    speak: (utterance) => spoken.push(utterance.text),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  // jsdom has no <dialog> modal support.
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
