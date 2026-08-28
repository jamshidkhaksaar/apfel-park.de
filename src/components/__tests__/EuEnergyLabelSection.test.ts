import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { EnergyClassArrow } from "../EuEnergyLabelSection";

describe("EnergyClassArrow contrast", () => {
  it("uses accessible text colors for every A-G grade", () => {
    for (const grade of ["A", "B", "C", "D", "E", "F"]) {
      const html = renderToStaticMarkup(createElement(EnergyClassArrow, { grade, locale: "de" }));
      expect(html).toContain("color:#111111");
    }
    const gradeG = renderToStaticMarkup(createElement(EnergyClassArrow, { grade: "G", locale: "de" }));
    expect(gradeG).toContain("background-color:#e3131b");
    expect(gradeG).toContain("color:#ffffff");
  });
});
