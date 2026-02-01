## 2024-05-24 - [Password Visibility Toggle]
**Learning:** Admin interfaces often require typing complex passwords. Lacking a "show password" toggle increases user frustration and error rates, especially when `auto-fill` is not available or reliable.
**Action:** Always include a visibility toggle for password fields in authentication forms, ensuring it has proper ARIA labels for accessibility.

## 2025-05-24 - [Accessible Form Inputs]
**Learning:** React `useId` is crucial for linking labels to inputs in reusable components where IDs must be unique across the page to prevent conflicts and ensure screen readers can programmatically associate labels with their controls.
**Action:** When building forms, always import `useId` to generate unique prefixes for `htmlFor` and `id` attributes, rather than relying on static strings or implicit label wrapping which can be inconsistent.
