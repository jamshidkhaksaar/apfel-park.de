## 2026-01-26 - Critical SEO Flaw in AppWrapper
**Learning:** The `AppWrapper` component uses `useState(false)` for `showContent` and only sets it to `true` in `useEffect`, which effectively hides all site content from Server Side Rendering (SSR) and search engine crawlers. The HTML output is empty div until client-side hydration.
**Action:** When auditing "performance", check for SEO-critical rendering patterns. A site that loads fast but has no content for crawlers is performant but useless. In future, check `RootLayout` wrappers for client-side rendering gates.

## 2026-01-27 - Throttling Canvas Animations
**Learning:** Decorative canvas animations often default to the user's native refresh rate (via `requestAnimationFrame`), which can be wasteful (e.g., 144Hz) for background effects. Throttling these to 30 FPS significantly reduces CPU usage and battery drain without noticeable visual degradation for background elements.
**Action:** Always consider capping FPS for non-interactive canvas animations using a delta-time check (`delta > interval`) inside the animation loop.

## 2026-01-28 - Client Bundle Bloat from i18n
**Learning:** Importing `getDictionary` in a Client Component (like `SiteHeader`) bundles the entire dictionary JSON into the client-side JavaScript chunk, even if only a small part is used. This unnecessarily increases the initial load size.
**Action:** Pass localized strings as props from Server Components to Client Components instead of importing the full dictionary in client-side code.
