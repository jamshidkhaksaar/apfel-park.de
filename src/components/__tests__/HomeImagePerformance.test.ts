import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getImageProps } from "next/image";

// The async homepage needs DB settings. Check its actual image declaration without
// initializing the server/data layer; the browser fixture checks candidate choice.
const page = readFileSync(new URL("../../app/(site)/[lang]/page.tsx", import.meta.url), "utf8");
const declaration = page.match(/<Image\s+src="\/images\/ipad\.png"[\s\S]*?\/>/)?.[0] ?? "";
describe("homepage repair image budget", () => {
  it("sizes the contained portrait, not the full width of its landscape stage", () => {
    const sizes = declaration.match(/sizes="([^"]+)"/)?.[1];
    expect(sizes).toBe("(max-width: 1023px) calc(64vw - 64px), (max-width: 1727px) calc(43vw - 76px), 668px");
    const { props } = getImageProps({ src: "/images/ipad.png", alt: "Fixture", fill: true, sizes });
    expect(props.srcSet).toContain("w=384&");
    expect(props.loading).toBe("lazy");
    expect(declaration).toContain("object-contain");
    expect(declaration).toContain('"Beschädigte Geräte zur Reparatur" : "Damaged devices for repair"');
  });
});
