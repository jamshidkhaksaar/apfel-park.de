## 2026-01-26 - Critical SEO Flaw in AppWrapper
**Learning:** The `AppWrapper` component uses `useState(false)` for `showContent` and only sets it to `true` in `useEffect`, which effectively hides all site content from Server Side Rendering (SSR) and search engine crawlers. The HTML output is empty div until client-side hydration.
**Action:** When auditing "performance", check for SEO-critical rendering patterns. A site that loads fast but has no content for crawlers is performant but useless. In future, check `RootLayout` wrappers for client-side rendering gates.

## 2026-01-27 - Throttling Canvas Animations
**Learning:** Decorative canvas animations often default to the user's native refresh rate (via `requestAnimationFrame`), which can be wasteful (e.g., 144Hz) for background effects. Throttling these to 30 FPS significantly reduces CPU usage and battery drain without noticeable visual degradation for background elements.
**Action:** Always consider capping FPS for non-interactive canvas animations using a delta-time check (`delta > interval`) inside the animation loop.

## 2026-02-02 - Client Bundle Optimization
**Learning:** Importing large configuration objects (like the i18n dictionary) directly into Client Components bundles the entire object into the client-side JavaScript, significantly increasing bundle size.
**Action:** Move data access to Server Components and pass only the necessary data slices as props to Client Components.

## 2026-02-04 - Hardcoded Data in Client Components
**Learning:** Hardcoding large static datasets (like product inventories) directly within Client Components bloats the JavaScript bundle unnecessarily.
**Action:** Extract such data to shared libraries (`src/lib`) or databases, fetch it via Server Components, and pass it down as props. This keeps the client bundle lightweight and allows for easier data management.

## 2026-03-24 - Isolating High-Frequency State Updates
**Learning:** Placing high-frequency state updates (like a `setInterval` clock ticking every second) in a top-level layout component (like `AdminShell`) causes the entire component tree to re-render constantly. This is extremely inefficient and degrades performance, especially in components with many DOM nodes, SVGs, or complex layouts.
**Action:** Isolate high-frequency state variables into their own small, dedicated components (e.g., `<AdminClock />`). This restricts the rapid re-renders to only the minimal required DOM nodes, preserving the performance of the broader application shell.
