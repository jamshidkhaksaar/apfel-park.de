import { describe, expect, it } from "vitest";

import { conditionDetailsChanged, resolveProductConditionNote, stripPlaceholderLines } from "../product-condition";

describe("resolveProductConditionNote", () => {
  const imported = {
    de: "Neu, originalverpackt und versiegelt.",
    en: "New, in the original sealed packaging.",
  };

  it("prefers a manually edited canonical note over stale import translations", () => {
    expect(resolveProductConditionNote(imported, "de", "Test")).toBe("Test");
    expect(resolveProductConditionNote(imported, "en", "Test")).toBe("Test");
  });

  it("keeps locale-specific copy while the canonical note still matches the import", () => {
    expect(resolveProductConditionNote(imported, "de", imported.de)).toBe(imported.de);
    expect(resolveProductConditionNote(imported, "en", imported.de)).toBe(imported.en);
  });

  it("falls back to the canonical note when no translations exist", () => {
    expect(resolveProductConditionNote(undefined, "de", "Open-Box, leichte Verpackungsspuren.")).toBe(
      "Open-Box, leichte Verpackungsspuren.",
    );
  });
});

describe("conditionDetailsChanged", () => {
  it("detects condition and condition-note edits", () => {
    expect(conditionDetailsChanged(
      { condition: "new", conditionNote: "Sealed" },
      { condition: "open_box", conditionNote: "Sealed" },
    )).toBe(true);
    expect(conditionDetailsChanged(
      { condition: "open_box", conditionNote: "Old note" },
      { condition: "open_box", conditionNote: "New note" },
    )).toBe(true);
  });

  it("ignores surrounding whitespace when deciding whether translations are stale", () => {
    expect(conditionDetailsChanged(
      { condition: "open_box", conditionNote: "Same note" },
      { condition: " open_box ", conditionNote: " Same note " },
    )).toBe(false);
  });
});

describe("stripPlaceholderLines", () => {
  it("drops empty template values but keeps real note text", () => {
    expect(stripPlaceholderLines("12 Monate Garantie\nnone\nnone")).toBe("12 Monate Garantie");
    expect(stripPlaceholderLines("Open-Box geprüft.\r\n None \n-\nN/A\nnull")).toBe("Open-Box geprüft.");
    expect(stripPlaceholderLines("none")).toBe("");
    expect(stripPlaceholderLines("Keine Kratzer, nonetheless top")).toBe("Keine Kratzer, nonetheless top");
  });

  it("applies when resolving the shown note", () => {
    expect(resolveProductConditionNote({ de: "Gebraucht, A+\nnone" }, "de", "Gebraucht, A+\nnone")).toBe("Gebraucht, A+");
  });
});
