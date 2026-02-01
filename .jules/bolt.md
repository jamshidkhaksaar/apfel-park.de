## 2026-01-26 - Critical SEO Flaw in AppWrapper
**Learning:** The `AppWrapper` component uses `useState(false)` for `showContent` and only sets it to `true` in `useEffect`, which effectively hides all site content from Server Side Rendering (SSR) and search engine crawlers. The HTML output is empty div until client-side hydration.
**Action:** When auditing "performance", check for SEO-critical rendering patterns. A site that loads fast but has no content for crawlers is performant but useless. In future, check `RootLayout` wrappers for client-side rendering gates.

## 2026-02-04 - Canvas Animation Throttling & Accessibility
**Learning:** High-frequency animation loops (`requestAnimationFrame`) run at the device's native refresh rate (up to 120Hz), draining battery on mobile devices. Additionally, failing to respect `prefers-reduced-motion` can cause accessibility issues. Early returns for reduced motion must still ensure the component initializes its static state correctly.
**Action:** Always wrap decorative `requestAnimationFrame` loops with a timestamp-based throttle (e.g., 30 FPS) and an explicit check for `prefers-reduced-motion`. Ensure resize handlers and initial draws are shared between animated and static states to avoid code duplication and logic gaps.
