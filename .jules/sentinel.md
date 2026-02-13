## 2024-05-22 - Unauthenticated API File Upload
**Vulnerability:** The `/api/branding` endpoint allowed unauthenticated POST requests to overwrite critical site assets (favicon, logo).
**Learning:** Middleware auth checks targeted only `/admin` paths, leaving `/api` endpoints exposed even though they were administratively sensitive.
**Prevention:** Enforce authentication within API route handlers or ensure middleware covers all sensitive paths (e.g. `/api/*`).

## 2024-05-23 - Stored XSS via SVG Upload
**Vulnerability:** The `/api/branding` endpoint allowed uploading SVG files containing malicious scripts (Stored XSS).
**Learning:** Checking file MIME types is insufficient for security; content validation is required for executable formats like SVG.
**Prevention:** Implemented regex-based content validation (`src/lib/security.ts`) to block common XSS vectors in SVGs. Note: `dompurify` was not added to avoid heavy dependencies (`jsdom`) in the API route, so a strict regex denylist is used.

## 2025-02-18 - Exposed Turnstile Secret Key via Public Table
**Vulnerability:** The Turnstile verification relied on `store_settings` being readable by the anonymous user, potentially exposing the Secret Key to the public if RLS was configured to allow this (which was necessary for the code to work).
**Learning:** Storing sensitive infrastructure secrets in a table that must be publicly readable for unauthenticated flows (like login/captcha) creates a security paradox.
**Prevention:** Use a Service Role client (`src/lib/supabase/admin.ts`) for server-side operations that need to access sensitive config, allowing the database table to be locked down (RLS restricted to authenticated users or admins).

## 2025-02-24 - SVG Stored XSS via SMIL Animation
**Vulnerability:** The regex-based `isSecureSvg` function failed to block SMIL animation tags (`<set>`, `<animate>`), allowing attackers to inject event handlers (e.g., `<set attributeName="onmouseover" to="alert(1)"/>`) without using explicit `on*` attributes or `javascript:` keywords directly in the tag body.
**Learning:** Blacklisting event handlers (like `onmouseover=`) is insufficient because SMIL tags can dynamically set these attributes.
**Prevention:** Explicitly block all SMIL animation tags (`set`, `animate`, `animateMotion`, `animateTransform`) and `<use>` in regex-based sanitizers, or switch to a robust parser-based sanitizer like `dompurify`.

## 2026-02-01 - Middleware Misconfiguration
**Vulnerability:** The authentication middleware was named `src/proxy.ts`, causing Next.js to potentially ignore it or fail to integrate with Supabase's expected flow, leaving admin routes potentially unprotected.
**Learning:** Next.js middleware relies on specific file naming conventions (i.e., `middleware.ts`), which can be a source of configuration errors. Supabase auth helpers, in particular, depend on this convention for proper execution.
**Prevention:** Ensure `src/middleware.ts` exists and is verified to run (e.g., by adding a log or checking headers) during deployment.

## 2026-02-15 - HTML Injection in Transactional Emails
**Vulnerability:** User-submitted contact form data was interpolated directly into the HTML body of notification emails, allowing attackers to inject malicious HTML/scripts (Reflected XSS in email clients).
**Learning:** Even internal notification emails are an attack vector if they render user input as HTML. Template literals are not safe for HTML generation with untrusted input.
**Prevention:** Introduced `escapeHtml` utility in `src/lib/security.ts` and enforced its usage for all user-controlled variables (including those that seem "safe" like dynamic subjects) in email templates.

## 2026-03-01 - MIME Type Spoofing in File Uploads
**Vulnerability:** File upload endpoints (`/api/branding` and `/api/admin/products/upload`) relied solely on the client-provided `Content-Type` header to validate file types, allowing attackers to upload malicious files (e.g., `.exe` or `.php`) disguised as images (e.g., `image/png`).
**Learning:** Relying on client-controlled metadata like `Content-Type` for security decisions is dangerous. File extensions and magic bytes should be validated independently.
**Prevention:** Implemented `validateImageFileExtension` in `src/lib/security.ts` to enforce that file extensions match their declared MIME types, serving as a defense-in-depth measure against polyglot files and simple extension spoofing.
