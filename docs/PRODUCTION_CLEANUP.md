# Production cleanup — 2026-09-07

Based on production commit `5872258f23b72cea0919e2f61f7067a159b8073c`.

## Scope and decisions

Reviewed source reachability, individual exports, imports, CSS references,
animations, runtime dependencies, and duplicate tracked public assets. Static
findings were checked against framework entry points, dynamic imports, scripts,
and tests before removal. This is a maintainability refactor, not a replacement
of the storefront or its operational workflows.

- Removed the unreferenced `ProductStatusBadge` and `ProductExperienceAdmin`
  components and 25 unused named exports (including wrappers, types, and hooks).
- Removed 131 unreferenced CSS selector branches and 20 orphan animations.
  Active theme, motion, accessibility, and responsive styles remain.
- Split the product editor into shared product types, form conversion/parsing,
  channel-field models, social response messages, experience presets, and a
  controlled experience panel. State stays in the editor so switching steps
  preserves unsaved changes. Creation and editing share applicable parsers.
- Consolidated stale intake updates into a shared helper. Inventory changes and
  product deactivation still use their existing database transaction.
- Fixed experience-only edits not enabling Save, and failed experience PATCH
  responses being silently treated as saved. A partial save now reports the
  failure and keeps experience edits available for retry.
- Enabled TypeScript unused-local/parameter checks and added `audit:unused` to CI
  and the canonical deployment gates.

The active legacy product editor, feature-flagged research workflow, framework
exports, dynamically loaded components, HTTP routes, operational scripts, and
historical migrations remain. Runtime dependencies all had source consumers;
tracked public assets had no identical-content duplicates. Public assets were
not classified as dead solely from missing source references because database
content and external clients can reference them.

## Validation

- Vitest: 678 passed, 22 skipped. New form tests cover grouped specs, FAQ parsing,
  variant data, zero/false/null distinctions, and social result messaging.
- Strict typecheck and ESLint.
- Source reachability audit with manual review of computed module loading.
- Seven deployment regression tests, including failed-gate and rollback paths.
- Synthetic browser checks: public consent, mobile filters, checkout UI,
  accessibility, storefront loading, product gallery focus, inventory pagination
  and enable/disable failure/retry, and Products date rendering at 390, 768,
  1366, and 1920 pixels.
- Actual editor components with mocked APIs: experience-only save, step-switch
  persistence, preserved stock/specs/draft status, and failed-save recovery.

The release process additionally gates activation on a production build,
package vulnerability audit, runtime image-upload regression, migrations, and
web/worker health checks. Synthetic browser checks do not exercise live payment
providers or every authenticated admin operation. Skipped integration tests need
an isolated integration database; they were not run against production data.

## Continuing checks

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run audit:unused`.
The reachability audit reports review candidates; it does not establish that
HTTP endpoints, public assets, CSS, or individual exports are unused. Review
computed imports and framework conventions before acting on future findings.
