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
