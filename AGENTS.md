# Repository Guidelines

## Project Structure & Module Organization
- `docker-compose.yml` and `wp-config.php` define the local WordPress stack.
- `wp-content/` contains runtime content (themes, plugins, uploads).
- `wp-content/themes/fixtech/` is the active theme with templates, `functions.php`, and assets.
- `fixtech/` appears to be a parallel theme copy for asset work; keep it in sync with the active theme if you edit here.
- `db_data/` and `db_dump.sql` hold local MariaDB data and the seed dump.

## Build, Test, and Development Commands
- `docker compose up` starts WordPress at `http://localhost:8000` and phpMyAdmin at `http://localhost:8080`.
- `npm install` in `wp-content/themes/fixtech` (or `fixtech`) installs the Tailwind toolchain.
- `npm run build` writes `assets/css/tailwind-build.css`; `npm run watch` rebuilds on changes.

## Coding Style & Naming Conventions
- Follow existing WordPress PHP style (tabs for indentation, spaces inside control parentheses).
- Keep template naming consistent with the theme (`page.php`, `single-*.php`, `taxonomy-*.php`).
- Prefer editing `src/input.css` and `tailwind.config.js` over direct edits to generated CSS.

## Testing Guidelines
- No automated test suite is present. Validate changes by running the site locally and checking relevant templates and WooCommerce flows.
- If you add tests or scripts, document the commands here.

## Commit & Pull Request Guidelines
- Git history is not available in this checkout; use short, imperative commit subjects (e.g., "Update header CTA styles").
- PRs should include a brief summary, linked issues, and screenshots for UI changes. Call out any updates to `db_dump.sql`.

## Configuration & Data
- `wp-config.php` and `docker-compose.yml` contain local credentials; avoid committing real secrets.
- Treat `db_data/` and `wp-content/uploads/` as environment data; edit them only when intentionally updating seed content.
