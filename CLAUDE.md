# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Apfel Park** is a bilingual (German/English) Next.js 16 website for a smartphone repair shop in Hamburg. It combines a public-facing storefront with a full admin dashboard and local PostgreSQL-backed data.

## Commands

```bash
npm run dev -- --port 3100  # Development; production owns port 3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Docker
docker build -t apfel .
docker run -p 3000:3000 apfel
```

Vitest is configured: `npm test`, `npm run test:watch`, or a single test with
`npx vitest run path/to/file.test.tsx`. Run `npm run typecheck` as well as lint/build.
Deployment shell regression tests: `python3 -m unittest discover -s deployment/vps/tests -v`
(temporary mocked filesystem fixture, not live deployment).

### Operations (updated 2026-09-04)

Follow `OPERATIONS.md` and `AGENTS.md`. Source is `/srv/apfel-park/app/source`;
use `app/worktrees/<name>` for isolated work. `app/current` points to an immutable
built release; do not edit generated output. Node >=24.14.0 <25 and npm >=11.12.0
<12 are required by `package.json`; explicitly select the correct PATH.
Deployment requires approval and a pinned pushed SHA through
`deployment/vps/scripts/deploy-app.sh`, not a build plus restart. Automatic code
rollback cannot undo schema changes; maintain old web/worker compatibility.
No production config/service changes belong in an isolated hardening task.

## Architecture

### Route Structure

```
src/app/
├── (site)/[lang]/     # Public pages, localized (de/en)
├── admin/             # Protected admin dashboard
├── api/               # API routes (contact, admin CRUD, branding)
├── login/             # Supabase Auth pages
└── maintenance/       # Maintenance mode fallback
```

The `[lang]` dynamic segment enables bilingual routing. Middleware (`src/middleware.ts`) handles locale detection, session management, and admin route protection.

### Key Architectural Layers

**i18n**: All user-facing text lives in `src/lib/i18n.ts` (~48KB). Access via `getDictionary(lang as Locale)`. Admin translations are in `src/lib/admin-i18n.ts`. Pages call `getDictionary` server-side and pass the dict down.

**Theme System**: Two themes — `dark` and `mono` (luxury gold). Theme is stored in both localStorage and cookies to prevent FOUC. An inline script in root `layout.tsx` sets `data-theme` before hydration. Custom CSS utilities like `.tech-card`, `.btn-primary`, `.gradient-text` are defined in `globals.css`.

**Supabase Clients**: Three distinct clients with different permission levels:
- `src/lib/supabase/client.ts` — browser client (public anon key)
- `src/lib/supabase/server.ts` — server component client (uses cookies)
- `src/lib/supabase/admin.ts` — service role client for admin operations (bypasses RLS)

Use the correct client for the context. Admin API routes use the service role client.

**Admin Auth**: `src/lib/admin-auth.ts` exports `isAdminUser()` which checks `ADMIN_EMAILS` env var or `app_metadata.role`. All admin API routes must call this check; admin pages use middleware for route protection.

**Security**: `src/lib/security.ts` provides input sanitization utilities. Contact form submissions go through reCAPTCHA v3 verification (`src/lib/recaptcha.ts`) before storage. Never store raw user input without sanitization.

**Assets**: Product images use the local upload storage implementation in `src/lib/blob.ts`. Dynamic branding (favicon, logo) is fetched from the `store_settings` database table via `/api/branding`.

### Next.js Patterns

Params are async in Next.js 16:
```typescript
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
}
```

Use `generateStaticParams` for locale pre-rendering:
```typescript
export const generateStaticParams = () => locales.map((lang) => ({ lang }));
```

### Code Conventions

- **TypeScript strict mode** — prefer `type` over `interface`, use explicit return types on exports
- **Path alias**: `@/*` → `./src/*`
- **Components**: PascalCase files, `"use client"` at top for client components
- **i18n**: never hardcode user-facing strings; always add to both `de` and `en` in `i18n.ts`
- **CSS**: Tailwind utilities first; custom classes defined in `globals.css`
- **Indentation**: 2 spaces; single quotes in TS; semicolons required

### Important Files

| File | Purpose |
|------|---------|
| `src/lib/i18n.ts` | All translations — edit for content changes |
| `src/lib/site.ts` | Business info (address, phone, hours) |
| `src/app/globals.css` | Theme CSS variables, custom utility classes, animations |
| `src/middleware.ts` | Locale routing, auth session refresh, admin protection |
| `src/lib/admin-auth.ts` | Admin role verification logic |
| `next.config.ts` | Standalone output, image domains, security headers |
