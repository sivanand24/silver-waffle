import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// WCAG 2.1 AA: 4.5:1 for normal text, 3:1 for icons and large UI.
const css = readFileSync(new URL("./theme.css", import.meta.url), "utf8");
const channel = (hex, i) => {
  const v = parseInt(hex.slice(i, i + 2), 16) / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) =>
  0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const used = (hex) => css.includes(hex) || (hex === "#ffffff" && css.includes("#fff"));

// [description, foreground, background, minimum]; each colour must still be used in theme.css.
const PAIRS = [
  ["body text on white", "#1d1b3a", "#ffffff", 4.5],
  ["muted text on white", "#6a6890", "#ffffff", 4.5],
  ["dark muted text on white", "#4f4d78", "#ffffff", 4.5],
  ["privacy line on white", "#55537a", "#ffffff", 4.5],
  ["link on pale panel", "#4527d6", "#f4f1ff", 4.5],
  ["kicker on pale chip", "#5b3df5", "#f0ecff", 4.5],
  ["reassurance on white", "#1f6b4f", "#ffffff", 4.5],
  ["notice text", "#6e5518", "#ffffff", 4.5],
  ["scheme icon", "#b43e0f", "#fff0d6", 4.5],
  ["white on gradient start", "#ffffff", "#4527d6", 4.5],
  ["white on gradient middle", "#ffffff", "#8a2fd0", 4.5],
  ["white on gradient end", "#ffffff", "#c4237a", 4.5],
  ["white on recording start", "#ffffff", "#d6246e", 4.5],
  ["white on recording end", "#ffffff", "#c2410c", 4.5],
  ["yes icon", "#ffffff", "#0b7a57", 3],
  ["no icon", "#ffffff", "#be123c", 3],
  ["unsure icon", "#ffffff", "#b45309", 3],
  ["footer text on page", "#b6b1e8", "#0e0b26", 4.5],
  ["sidebar copy on indigo", "#dcd7ff", "#2a1b8f", 4.5],
  ["sidebar steps on indigo", "#cbc5ff", "#2a1b8f", 4.5],
  ["caption label on navy", "#8ff0ff", "#1e1458", 4.5],
  ["highlight on navy", "#ffd28a", "#1e1458", 4.5],
];

for (const [name, fg, bg, min] of PAIRS)
  test(`contrast: ${name} is at least ${min}:1`, () => {
    for (const hex of [fg, bg])
      assert.ok(used(hex), `${hex} no longer appears in theme.css; update this table`);
    const ratio = contrast(fg, bg);
    assert.ok(ratio >= min, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
  });

test("the old failing colours are gone from the theme", () => {
  for (const gone of ["#ff4d8d,#ff7a3d", "#2e8f6b", "#d4551f"])
    assert.ok(!css.includes(gone), gone + " should not return");
});
