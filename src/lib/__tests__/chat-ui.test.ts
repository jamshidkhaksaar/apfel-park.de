import { describe, expect, it } from "vitest";

import { shouldHideChatWidget, shouldHideChatWidgetOnMobile } from "../chat-ui";

describe("chat widget visibility", () => {
  it("hides the floating launcher on localized checkout routes", () => {
    expect(shouldHideChatWidget("/de/checkout")).toBe(true);
    expect(shouldHideChatWidget("/en/checkout/success")).toBe(true);
    expect(shouldHideChatWidget("/de/store/iphone-15-pro")).toBe(true);
    expect(shouldHideChatWidget("/de/store")).toBe(false);
    expect(shouldHideChatWidget("/de/store/catalog")).toBe(false);
    expect(shouldHideChatWidget("/de/store/catalog?x=1")).toBe(false);
    expect(shouldHideChatWidget("/de/store/catalog/")).toBe(false);
    expect(shouldHideChatWidget("/de/cart")).toBe(false);
  });

  it("hides chat on mobile storefront landing pages without hiding desktop chat", () => {
    expect(shouldHideChatWidgetOnMobile("/de")).toBe(true);
    expect(shouldHideChatWidgetOnMobile("/en/store")).toBe(true);
    expect(shouldHideChatWidgetOnMobile("/de/store/catalog?view=all")).toBe(true);
    expect(shouldHideChatWidgetOnMobile("/de/cart")).toBe(false);
    expect(shouldHideChatWidget("/de")).toBe(false);
    expect(shouldHideChatWidget("/de/store")).toBe(false);
  });
});
