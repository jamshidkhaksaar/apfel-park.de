## 2024-05-24 - [Password Visibility Toggle]
**Learning:** Admin interfaces often require typing complex passwords. Lacking a "show password" toggle increases user frustration and error rates, especially when `auto-fill` is not available or reliable.
**Action:** Always include a visibility toggle for password fields in authentication forms, ensuring it has proper ARIA labels for accessibility.

## 2026-01-30 - [Form Accessibility]
**Learning:** Basic form inputs like Name and Email often lack programmatic association with their labels, making them inaccessible to screen readers and harder to click.
**Action:** Use React's `useId` hook to generate unique IDs and strictly enforce `htmlFor`-`id` pairing on all form inputs.

## 2026-01-30 - [Hover-Only Interactive Overlays]
**Learning:** Elements that appear only on hover (like "Quick View" buttons) create keyboard traps where users tab into invisible elements. `opacity-0` hides visuals but not focus.
**Action:** Ensure overlay containers have `focus-within:opacity-100` (or similar) so interactive children become visible when focused via keyboard.

## 2024-01-31 - [Skip to Content Navigation]
**Learning:** Single Page Applications (or similar Next.js apps) often reset focus or keep it at the top on navigation. Without a "Skip to Content" link, keyboard users must tab through the entire navigation menu on every page load.
**Action:** Implement a hidden-until-focused "Skip to Content" link as the first focusable element in the DOM, targeting the main content wrapper (e.g. `main` tag with an id).

## 2026-02-12 - [Context-Aware Form Pre-filling]
**Learning:** Users often click "Buy Now" on a specific item but land on a generic contact form, causing friction as they must manually re-enter the product name.
**Action:** Pass context (like product names) via URL query parameters and use them to auto-populate form fields, ensuring the receiving component handles the parameters safely (e.g. via Suspense boundaries in Next.js).

## 2026-05-24 - [Floating Action Button Overlap & Accessibility]
**Learning:** Floating action buttons (FABs) often overlap if not managed with a stacking context or explicit vertical offsets. Tooltips on FABs must be visible on keyboard focus, not just hover, and linked via `aria-describedby`.
**Action:** Stack FABs vertically using distinct `bottom` values (e.g., `bottom-6`, `bottom-28`) and implement `onFocus`/`onBlur` handlers for tooltips.
