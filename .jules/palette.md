## 2024-05-24 - [Password Visibility Toggle]
**Learning:** Admin interfaces often require typing complex passwords. Lacking a "show password" toggle increases user frustration and error rates, especially when `auto-fill` is not available or reliable.
**Action:** Always include a visibility toggle for password fields in authentication forms, ensuring it has proper ARIA labels for accessibility.

## 2026-01-30 - [Form Accessibility]
**Learning:** Basic form inputs like Name and Email often lack programmatic association with their labels, making them inaccessible to screen readers and harder to click.
**Action:** Use React's `useId` hook to generate unique IDs and strictly enforce `htmlFor`-`id` pairing on all form inputs.
