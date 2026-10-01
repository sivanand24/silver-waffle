import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { spoken } from "./test/setup.js";

// A scripted microphone: first press starts recording, second press delivers the transcript.
const mic = vi.hoisted(() => ({ transcript: "हाँ" }));
vi.mock("./voice/recorder.js", () => ({
  createVoiceRecorder: ({ onChange }) => {
    let state = {
      status: "idle",
      target: "answer",
      transcript: "",
      level: 0,
      seconds: 0,
      error: "",
    };
    const emit = (patch) => onChange((state = { ...state, ...patch }));
    return {
      start: (target = "answer") => {
        if (state.status === "recording")
          return emit({ status: "review", transcript: mic.transcript });
        emit({ status: "recording", target, transcript: "", error: "" });
      },
      stop: () => {},
      cancel: () => emit({ status: "idle", transcript: "", error: "" }),
      destroy: () => {},
    };
  },
}));

const user = () => userEvent.setup();
const button = (name) => screen.getByRole("button", { name });

function mockApi({ guide } = {}) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      if (url === "/api/health")
        return { ok: true, json: async () => ({ geminiConfigured: true }) };
      if (url === "/api/guide") {
        if (!guide) throw new Error("offline");
        return { ok: true, json: async () => guide };
      }
      throw new Error("unexpected request " + url);
    }),
  );
}

async function startUjjwala(u) {
  await u.click(button(/गैस कनेक्शन/));
  await u.click(button(/हाँ, मदद चाहिए/));
}
const answer = (u, label) => u.click(button(new RegExp("^" + label + "$")));

beforeEach(() => {
  mic.transcript = "हाँ";
  mockApi();
});

describe("journey", () => {
  it("walks one woman from choosing a service to a saved-ready checklist", async () => {
    const u = user();
    render(<App />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/अपनी बात कहिए/);

    await startUjjwala(u);
    for (const label of ["हाँ", "नहीं", "नहीं", "हाँ"]) await answer(u, label);
    expect(await screen.findByText(/अब कागज़ों की तैयारी करते हैं/)).toBeInTheDocument();

    await u.click(button(/मेरे कागज़ देखें/));
    const card = (await screen.findByRole("heading", { name: "आधार की प्रतियाँ" })).closest(
      "article",
    );
    await u.click(within(card).getByRole("button", { name: "है" }));
    expect(card).toHaveClass("ready");

    await u.click(await screen.findByRole("button", { name: /मेरी तैयारी की सूची बनाएँ/ }));
    await screen.findByText("आवेदन अभी जमा नहीं हुआ है।");
    const summary = document.querySelector(".readiness-summary");
    expect(within(summary).getAllByRole("generic").length).toBeGreaterThan(0);
    expect(summary.textContent).toMatch(/1.*कागज़ तैयार/);
    expect(screen.getByText("आवेदन अभी जमा नहीं हुआ है।")).toBeInTheDocument();
  });

  it("stops early with a helpline when she is under 18", async () => {
    const u = user();
    render(<App />);
    await startUjjwala(u);
    await answer(u, "नहीं");
    expect(await screen.findByText(/वयस्क महिला के नाम पर/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /हेल्पलाइन/ })).toHaveAttribute("href", "tel:14438");
    expect(screen.queryByRole("button", { name: /मेरे कागज़ देखें/ })).toBeNull();
  });

  it("never guesses: 'पता नहीं' becomes a check step, not a verdict", async () => {
    const u = user();
    render(<App />);
    await startUjjwala(u);
    await answer(u, "पता नहीं");
    await answer(u, "नहीं");
    await answer(u, "नहीं");
    await answer(u, "हाँ");
    expect(await screen.findByText(/एक बात की जाँच अभी बाकी है/)).toBeInTheDocument();
  });

  it("changing an earlier answer clears the later ones", async () => {
    const u = user();
    render(<App />);
    await startUjjwala(u);
    await answer(u, "हाँ");
    await u.click(button(/पिछला कदम/));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/18 साल/);
    expect(button(/^हाँ$/)).toHaveClass("selected");
    await answer(u, "नहीं");
    expect(await screen.findByText(/वयस्क महिला के नाम पर/)).toBeInTheDocument();
  });

  it("asks before discarding a journey and returns to the service list", async () => {
    const u = user();
    render(<App />);
    await startUjjwala(u);
    await answer(u, "हाँ");
    await u.click(button(/दूसरी सहायता चुनें/));
    await u.click(await screen.findByRole("button", { name: /हाँ, दूसरी सहायता चुनें/ }));
    expect(await screen.findByText(/अपना रास्ता चुनिए/)).toBeInTheDocument();
  });

  it("keeps the three services separate", async () => {
    const u = user();
    render(<App />);
    await u.click(button(/बैंक खाता/));
    await u.click(button(/हाँ, मदद चाहिए/));
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent(/गैस/);
  });
});

describe("voice", () => {
  it("reads her words back and applies the confirmed answer", async () => {
    const u = user();
    render(<App />);
    await startUjjwala(u);
    await u.click(button(/बोलकर जवाब दें/));
    expect(screen.getAllByText(/सुन रही हूँ/).length).toBeGreaterThan(0);
    await u.click(button(/बोल लिया — अब रोकें/));

    // The transcript is visible, editable, and spoken back.
    expect(await screen.findByLabelText(/आपने कहा/)).toHaveValue("हाँ");
    await waitFor(() => expect(spoken.some((t) => t.startsWith("आपने कहा: हाँ"))).toBe(true));

    await u.click(button(/सही है/));
    expect(screen.getByText(/सवाल 2 /)).toBeInTheDocument();
  });

  it("lets her correct a wrong transcript before it is used", async () => {
    mic.transcript = "नहीं";
    const u = user();
    render(<App />);
    await startUjjwala(u);
    await u.click(button(/बोलकर जवाब दें/));
    await u.click(button(/बोल लिया — अब रोकें/));
    const box = await screen.findByLabelText(/आपने कहा/);
    await u.clear(box);
    await u.type(box, "हाँ");
    await u.click(button(/सही है/));
    // "हाँ" to the age question moves on instead of stopping at the under-18 result.
    expect(screen.queryByText(/वयस्क महिला के नाम पर/)).toBeNull();
    expect(screen.getByText(/सवाल 2 /)).toBeInTheDocument();
  });
});

describe("help dialog", () => {
  it("shows a live answer with its official source", async () => {
    mockApi({
      guide: {
        answer: "आधार और पासबुक ले जाएँ।",
        mode: "live",
        sourceUrl: "https://example.gov.in/",
      },
    });
    const u = user();
    render(<App />);
    await startUjjwala(u);
    await u.click(button(/मदद चाहिए/));
    const dialog = await screen.findByRole("dialog", { name: /पूछिए/, hidden: true });
    await u.click(
      within(dialog)
        .getAllByRole("button", { hidden: true })
        .find((b) => /कौन से कागज़/.test(b.textContent)),
    );
    expect(
      await within(dialog).findByText("आधार और पासबुक ले जाएँ।", {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("ApniBaat का जवाब")).toBeInTheDocument();
    expect(
      within(dialog).getByRole("link", { name: /सरकारी स्रोत/, hidden: true }),
    ).toHaveAttribute("href", "https://example.gov.in/");
  });

  it("falls back to a safe Hindi message when the server is unreachable", async () => {
    mockApi();
    const u = user();
    render(<App />);
    await startUjjwala(u);
    await u.click(button(/मदद चाहिए/));
    const dialog = await screen.findByRole("dialog", { name: /पूछिए/, hidden: true });
    await u.type(within(dialog).getByLabelText("आपका सवाल"), "क्या चाहिए?");
    await u.click(within(dialog).getByRole("button", { name: /जवाब बताएँ/, hidden: true }));
    expect(
      await within(dialog).findByText(/अभी सवाल का जवाब नहीं मिला/, {}, { timeout: 2000 }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("अभी संपर्क नहीं हुआ")).toBeInTheDocument();
  });
});

describe("accessibility", () => {
  it("offers a skip link to the main content and labels the region it jumps to", () => {
    render(<App />);
    expect(screen.getByRole("link", { name: /मुख्य जानकारी पर जाएँ/ })).toHaveAttribute(
      "href",
      "#main",
    );
    expect(screen.getByRole("main")).toHaveAttribute("id", "main");
  });

  it("lets her switch to large text and remembers it", async () => {
    localStorage.clear();
    const u = user();
    const { unmount } = render(<App />);
    const toggle = button(/बड़े अक्षर/);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    await u.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("large-text");

    unmount();
    document.documentElement.classList.remove("large-text");
    render(<App />);
    expect(button(/बड़े अक्षर/)).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("large-text");
  });

  it("moves focus to the question heading so a screen reader announces it", async () => {
    const u = user();
    render(<App />);
    await startUjjwala(u);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveFocus();
  });
});
