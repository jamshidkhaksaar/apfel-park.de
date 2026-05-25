# Apfel Park

Self-hosted Next.js storefront and repair workflow for `apfel-park.de`.

This project powers the public marketing site, admin dashboard, repair intake flow, localized transactional emails, and SEO/privacy pages for a Hamburg repair and retail shop. The current production deployment runs on a VPS with local PostgreSQL and a separate self-hosted mail stack on the same server.

## Stack

- Next.js 16 App Router
- React 19
- PostgreSQL via `pg`
- Nodemailer for transactional email
- Tailwind CSS 4
- Self-hosted file uploads on disk

## Current Architecture

- Public site:
  - localized German and English routes
  - service and product pages
  - SEO metadata, `sitemap.xml`, `robots.txt`
  - privacy and consent-aware external embeds
- Admin:
  - local admin authentication
  - branding management
  - repair workflow management
  - review management
  - SEO management
  - product, orders, and settings sections
- Data:
  - local PostgreSQL database
  - uploaded files stored under `/srv/apfel-park/app/shared/uploads`
- Email:
  - SMTP delivery through `mail.apfel-park.de`
  - repair notifications and status updates sent from `repairs@apfel-park.de`

## Key Features

### Repair workflow

- public repair request form
- localized repair request confirmation emails
- admin mailbox-style repair workspace
- repair status transitions with customer email updates
- cost estimate, final cost, notes, and repair summary fields

### Consent and privacy

- cookie/privacy banner
- consent-gated Google Maps embeds
- consent-gated Google reCAPTCHA loading when enabled
- privacy pages updated for the live Hetzner + Cloudflare + self-hosted mail setup

### SEO

- admin SEO editor for public pages
- canonical and alternate-language metadata
- dynamic sitemap and robots endpoints
- Google/Bing verification support

## Local Development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Run lint:

```bash
npm run lint
```

Build production output:

```bash
npm run build
```

## Environment

Copy `.env.example` and fill in real values for your environment.

Main variables:

```bash
DATABASE_URL=
APP_SESSION_SECRET=
ADMIN_EMAILS=
ADMIN_PASSWORD=
UPLOADS_DIR=

CONTACT_NOTIFICATION_EMAIL=
REPAIRS_NOTIFICATION_EMAIL=

SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Notes:

- the app no longer depends on Supabase or Vercel Blob at runtime
- email delivery is SMTP-based, not Resend-based
- Google Maps is optional but the embed is consent-gated

## Deployment Notes

Production currently uses:

- `nginx` as reverse proxy
- `systemd` for the Next.js service
- local PostgreSQL
- self-hosted mail server on `mail.apfel-park.de`

Typical production cycle:

1. update app source
2. run `npm run lint`
3. run `npm run build`
4. refresh the standalone static symlink if needed
5. restart `apfel-park-nextjs.service`

## Repository Notes

- legacy admin content routes were removed
- legacy Supabase-specific runtime code was replaced with local auth/db adapters
- this repository contains application code only, not full server provisioning

## Compliance Note

The codebase includes a more accurate privacy/cookie implementation for the current live stack, but this repository is not legal advice. For a production shop in Germany or the EU, controller-side documentation and legal review are still required.
