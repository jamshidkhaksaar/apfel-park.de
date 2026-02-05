## 2026-01-26 - Critical SEO Flaw in AppWrapper
**Learning:** The `AppWrapper` component uses `useState(false)` for `showContent` and only sets it to `true` in `useEffect`, which effectively hides all site content from Server Side Rendering (SSR) and search engine crawlers. The HTML output is empty div until client-side hydration.
**Action:** When auditing "performance", check for SEO-critical rendering patterns. A site that loads fast but has no content for crawlers is performant but useless. In future, check `RootLayout` wrappers for client-side rendering gates.

## 2026-01-27 - Throttling Canvas Animations
**Learning:** Decorative canvas animations often default to the user's native refresh rate (via `requestAnimationFrame`), which can be wasteful (e.g., 144Hz) for background effects. Throttling these to 30 FPS significantly reduces CPU usage and battery drain without noticeable visual degradation for background elements.
**Action:** Always consider capping FPS for non-interactive canvas animations using a delta-time check (`delta > interval`) inside the animation loop.

## 2026-02-02 - Client Bundle Optimization
**Learning:** Importing large configuration objects (like the i18n dictionary) directly into Client Components bundles the entire object into the client-side JavaScript, significantly increasing bundle size.
**Action:** Move data access to Server Components and pass only the necessary data slices as props to Client Components.
