# AGENTS.md - AI Coding Agent Guidelines

This document provides guidelines for AI coding agents working in the Apfel Park codebase.

## Project Overview

**Apfel Park** is a bilingual (German/English) Next.js website for a smartphone repair shop in Hamburg, Germany. The site features a modern tech aesthetic with gold accent colors, glass-morphism effects, and dark/light theme support.

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16.x (App Router) |
| Language | TypeScript 5.x (strict mode) |
| Runtime | Node.js 18+ |
| UI | React 19.x |
| Styling | Tailwind CSS 4.x |
| Linting | ESLint 9 with Next.js + TypeScript presets |
| Containerization | Docker (multi-stage build, standalone output) |

## Build/Lint/Test Commands

```bash
# Development
npm run dev          # Start dev server at localhost:3000

# Production
npm run build        # Build for production
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint

# Docker
docker build -t apfel .                    # Build Docker image
docker run -p 3000:3000 apfel              # Run container
```

### Running Tests

No testing framework is currently configured. When adding tests:
- Recommended: Vitest or Jest with React Testing Library
- Place test files adjacent to source: `Component.test.tsx`
- Run single test: `npx vitest run path/to/file.test.tsx`

## Project Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (site)/[lang]/        # Localized public pages (de/en)
│   │   ├── about/
│   │   ├── contact/
│   │   ├── repairs/
│   │   ├── services/
│   │   ├── layout.tsx        # Site layout with header/footer
│   │   └── page.tsx          # Homepage
│   ├── admin/                # Admin dashboard (scaffold)
│   ├── globals.css           # Tailwind + CSS variables + animations
│   └── layout.tsx            # Root layout
├── components/               # Shared React components
│   ├── admin/                # Admin-specific components
│   ├── SiteHeader.tsx
│   ├── SiteFooter.tsx
│   ├── ThemeToggle.tsx
│   └── LocaleSwitcher.tsx
└── lib/                      # Utilities and configuration
    ├── i18n.ts               # Internationalization dictionaries
    ├── metadata.ts           # SEO metadata helpers
    └── site.ts               # Site info (name, address, contact)
```

## Code Style Guidelines

### TypeScript

- **Strict mode enabled** - No implicit `any`, strict null checks
- Use explicit return types for exported functions
- Prefer `type` over `interface` for object types
- Use `as const` for literal type assertions

```typescript
// Good
export type Locale = "de" | "en";
export const locales: Locale[] = ["de", "en"];

// Good - explicit return type
export const createMetadata = (
  locale: Locale,
  title: string,
  description: string,
  path: string,
): Metadata => { ... };
```

### Imports

- Use path aliases: `@/*` maps to `./src/*`
- Order imports: React/Next.js first, then external packages, then local modules
- Use relative imports within the same directory tree
- Separate import groups with blank lines

```typescript
// Good
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { getDictionary, type Locale } from "../lib/i18n";
import { siteInfo } from "../lib/site";
```

### React Components

- Use function components with `export default`
- Client components must have `"use client"` directive at top
- Props type defined inline or with explicit type
- Destructure props in function signature

```typescript
// Good - Server Component (default)
export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  // ...
}

// Good - Client Component
"use client";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>("dark");
  // ...
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `SiteHeader.tsx`, `ThemeToggle.tsx` |
| Utilities | camelCase | `createMetadata`, `getDictionary` |
| Constants | camelCase or SCREAMING_SNAKE | `siteInfo`, `locales` |
| CSS Classes | kebab-case | `container-page`, `tech-card` |
| Types | PascalCase | `Locale`, `Metadata` |

### CSS & Styling

- Use Tailwind CSS utility classes
- Custom utilities defined in `globals.css`
- CSS variables for theming (light/dark mode via `data-theme` attribute)
- Prefer utility classes over custom CSS

```tsx
// Good - Tailwind utilities
<div className="flex items-center gap-2 rounded-xl bg-surface p-4">

// Available custom classes
// .container-page - max-width container with padding
// .section-pad - section vertical padding
// .tech-card - glass-morphism card style
// .tech-card-hover - card with hover effect
// .btn-primary - gold gradient button
// .btn-secondary - outlined button
// .gradient-text - gold gradient text
// .badge-gold, .badge-green - status badges
```

### Internationalization (i18n)

- All user-facing text in `src/lib/i18n.ts`
- Pages under `[lang]` dynamic route segment
- Use `getDictionary(lang)` to access translations
- Supported locales: `de` (German), `en` (English)

```typescript
// Good
const dict = getDictionary(lang as Locale);
return <h1>{dict.home.hero.title}</h1>;
```

### Error Handling

- Use Next.js `notFound()` for 404 responses
- Validate locale in layouts before rendering
- Early returns for guard clauses

```typescript
// Good
if (!locales.includes(locale)) {
  notFound();
}
```

### Metadata & SEO

- Use `createMetadata()` helper from `src/lib/metadata.ts`
- Export `generateMetadata` for dynamic metadata
- Include OpenGraph and Twitter cards

```typescript
export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> => {
  const { lang } = await params;
  const dict = getDictionary(lang as Locale);
  return createMetadata(lang as Locale, dict.meta.home.title, dict.meta.home.description, "");
};
```

## File Formatting

- 2 spaces for indentation
- No trailing whitespace
- Single quotes for strings in TypeScript (except JSX attributes)
- Semicolons required
- Arrow functions for all function expressions
- Trailing commas in multiline arrays/objects

## Next.js Patterns

### Static Generation

Use `generateStaticParams` for static route generation:

```typescript
export const generateStaticParams = () =>
  locales.map((lang) => ({ lang }));
```

### Async Server Components

Next.js 16+ uses async params:

```typescript
export default async function Page({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  // ...
}
```

## Important Files

| File | Purpose |
|------|---------|
| `src/lib/i18n.ts` | All translations - edit for content changes |
| `src/lib/site.ts` | Business info (address, phone, hours) |
| `src/app/globals.css` | Theme variables, custom utilities, animations |
| `next.config.ts` | Next.js config (standalone output mode) |
| `eslint.config.mjs` | ESLint config |

## Common Tasks

### Add a new page

1. Create directory under `src/app/(site)/[lang]/`
2. Add `page.tsx` with metadata generation
3. Add translations to `src/lib/i18n.ts` for both `de` and `en`
4. Add navigation link to `dictionary.nav` in i18n.ts

### Add a component

1. Create file in `src/components/`
2. Use PascalCase naming
3. Add `"use client"` if using hooks or browser APIs
4. Import using relative path from consuming file

### Modify theme colors

Edit CSS variables in `src/app/globals.css`:
- `:root` for dark theme (default)
- `[data-theme="light"]` for light theme
