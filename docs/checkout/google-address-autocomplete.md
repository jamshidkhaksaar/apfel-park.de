# Inline checkout address suggestions

The existing German/English street-and-number input is a native labeled combobox.
`CheckoutStreetAddress` adds a dropdown to that field; it adds no search field,
map, activation panel, or enable/disable control. The delivery form, required
validation, error-summary association, manual edits, and payment invalidation
continue through `CheckoutClient.updateCustomerField`. Selection changes only
line1, postcode, and city. Contact details and line2 are preserved.

## Implementation plan and TDD evidence

1. Write failing checkout render contracts for an inline combobox and absence of
   the standalone panel. Replace the panel with an inert street-field component;
   verify that slice passes.
2. Replace the widget browser tests with explicitly mocked Places (New) Data API
   tests against the inert component. Capture failures before implementing
   consent, debounce, predictions, selection, session tokens, and race guards.
3. Add a failing native-autofill fallback assertion, then restore browser autofill
   when the SDK fails. Extend the styled fixture to the actual checkout client.
4. Stop implementation, then run tests, lint, typecheck, unused-source audit and
   browser regression serially. The parent owns build/deployment and real-provider
   verification.

Logs are in `/root/.hermes/cache/scratch/google-inline-*.log`:

- `red-contract.log`: 2 failing assertions, 4 passing tests on the original panel.
  Dependencies were initially absent; the earlier startup failure was resolved
  with `npm ci --ignore-scripts` from the unchanged lockfile (`install.log`).
- `green-contract.log`: all 6 checkout tests pass with the inert inline field.
- `red-browser.log`: 8 behavior groups fail against that inert component; the
  unchanged checkout-only CSP group passes.
- `green-browser.log`: all 9 original behavior groups pass with the Data API mock.
- `red-autofill.log`: SDK failure leaves autocomplete off, failing the new test.
- `green-autofill.log`: all 10 groups pass, including the actual checkout client.
- `red-integration.log` / `fixture-debug.log`: fixture setup failures, **not**
  product TDD evidence; the Next browser shell needed a synthetic process.env.
- `red-enter.log` / `green-enter.log`: historical tests incorrectly treated native
  submission after dismissal as a regression. The review fixes below supersede
  those assertions and restore native Enter behavior when the menu is closed.
- `green-cleanup.log`: expanded errors, pending-query abandonment, styles and
  cleanup checks.
- `final-tests.log`, `final-lint.log`, `final-typecheck.log`, `final-unused.log`,
  `final-browser.log`: final serial gates.

## Consent and manual fallback

The existing `readConsentMode()` cookie/storage and `apfel-consent-change` event
are authoritative. Only `external` consent permits Google SDK loading and
suggestions. Unset/necessary consent shows one compact helper line with a button
that opens the existing Cookie settings dialog using `openConsentSettings()`;
this never grants consent itself. CookieBanner and default bilingual privacy
content explicitly disclose address suggestions among external services.

No SDK load happens for pickup, absent/blank dedicated browser key, fewer than
three query characters, or an unfocused field. With consent, typing is debounced
300 ms. A focused field can resume after consent is granted. Withdrawal closes
suggestions and invalidates pending work immediately without changing fields.
Manual typing always remains available. Native address autofill is preserved
when Google is unavailable; it is turned off while Google suggestions are enabled
to avoid competing menus.

The runtime browser key is passed by the existing dynamic checkout page. This
work neither reads nor changes its configuration. Browser keys remain visible to
visitors; referrer and API restrictions, quotas and billing are operator-owned.
No shared environment, catalog, database, privacy override or migration changes
are part of this task. Default privacy text is not evidence that a database policy
override has been checked; the parent must review that separately.

## Current API and sessions

The existing singleton lazy loader exposes
`AutocompleteSuggestion.fetchAutocompleteSuggestions` and
`AutocompleteSessionToken` from `importLibrary('places')`. Requests include
`includedRegionCodes: ['de']`, the checkout `language`, `region: 'de'`, and a
per-interaction token. There is no primary-type filter: complete German addresses
are checked after selection rather than relying on unverified filters.

The token is reused for successive queries within an interaction and discarded
on selection or abandonment (blur, Tab, Escape, short/empty query, withdrawal,
pickup/unmount, failure). Predictions use `text.toString()` for display and
`toPlace().fetchFields({ fields: ['addressComponents'] })` for selection. Google
propagates the prediction request's session token into the first details request.
No token is reused after that request; no selected-text refetch occurs until the
user edits it. Session tokens group billing; they do not guarantee free requests,
and abandoned interactions may still incur provider charges.

There is no legacy Autocomplete or PlaceAutocompleteElement. No geometry,
formatted-address, photos, map, persistent prediction cache, or prediction logging
is introduced. The narrow dropdown displays unmodified, nontranslated
"Google Maps" attribution at 12px, weight 400, normal spacing, sans serif; color
is white in dark mode and #1f1f1f in the site's light (`mono`) theme.

## Accessibility, failures and races

The input exposes combobox/list autocomplete semantics with an expanded listbox,
stable real option IDs, active-descendant and selected-option state. Arrow keys
move the active option. Enter prevents form submission only while the suggestions
menu is open, selecting the active option when present and otherwise leaving the
text unchanged. With no menu (missing key, necessary-only consent, provider
failure, pending predictions, selection completed, or dismissed suggestions),
Enter retains the native input/form behavior. Escape, Tab and blur close without selection or
focus trapping. Pointer selection prevents the input-blur race. Focus stays in
the input after selection. Options scroll within a max-height dropdown; input
and dropdown share responsive width. Status/fallback text is politely announced.

IME composition start closes suggestions and invalidates pending debounce,
predictions and details. Interim text does not schedule or send provider requests;
composition end schedules the committed value with the normal debounce. Composing
native key events and keys during an active composition retain native defaults
without navigating or selecting options. Input change, keyboard and composition
callbacks are forwarded.

Generation and manual-edit revision checks invalidate stale predictions/details
synchronously. Callback refs stay current. Queries, new selections, edits to any
customer field, blur, consent withdrawal, pickup and unmount cannot be overwritten
by late details. Abandoned operation timeout listeners/timers are cleaned up;
provider work already sent cannot be recalled. Invalid/non-German/incomplete
addresses and details failures preserve manually entered fields. SDK/auth/query
failures fall back without automatic retry storms; a new consent grant or fresh
mount can start a fresh interaction. Both details and predictions time out after
15 seconds, and the existing singleton SDK readiness timeout and late auth-failure
subscriptions remain intact.

## Validation scope and remaining review

`scripts/google-checkout.browser-test.mjs` serves isolated React StrictMode and
actual CheckoutClient fixtures with the candidate `next.config.ts` headers and
compiled project styles. Routing/image shells are mocked; payment SDK rendering
is stubbed. Cart validation uses synthetic data; all other API routes are blocked.
Every provider request is intercepted and fulfilled with an explicitly mocked NEW
Data API or a synthetic failure. No real Google or payment request or real order
is made. The script uses the installed Playwright and Chromium paths specified in
the task, and accepts `PLAYWRIGHT_MODULE`.

Checkout-only CSP and its exact locale paths remain unchanged, with no
unsafe-eval relaxation. Local mocks do not establish live CSP compatibility,
provider authorization, quotas, billing, actual prediction quality, or real
Google success. The parent must perform build, policy-override review and real
provider verification with public addresses before its release decision.

## Official references checked

- [Programmatic Autocomplete (New)](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data)
- [Autocomplete Data reference](https://developers.google.com/maps/documentation/javascript/reference/autocomplete-data)
- [Places policies and Google Maps attribution](https://developers.google.com/maps/documentation/places/web-service/policies)

## Original inline implementation result (2026-10-01)

All required full gates ran serially after source implementation stopped and
exited 0: 185 test files passed, 2 skipped; 1,291 tests passed, 22 skipped;
lint passed without warnings; strict typecheck passed; unused-source audit checked
815 files and found 0 unreachable source-file candidates; all 10 explicitly
mocked browser groups passed. `git diff --check` passed. HEAD remains
`a460a7060e2eee11558043eca63abdf8a4b5b527`; no commit, push, deployment, restart,
shared environment change, database/catalog change, or real provider API request
was performed. Dependency versions and lockfile are unchanged.

Actual edited files:

- Added `src/components/checkout/CheckoutStreetAddress.tsx`.
- Removed `src/components/checkout/GoogleAddressSearch.tsx`.
- `src/components/checkout/CheckoutClient.tsx`.
- `src/lib/google-places-loader.ts`.
- `src/lib/i18n.ts`.
- `src/components/CookieBanner.tsx`.
- `src/app/globals.css` (two attribution theme variables only).
- `src/lib/__tests__/google-places-checkout.test.ts`.
- `src/lib/__tests__/google-places-loader.test.ts`.
- `scripts/google-checkout.browser-test.mjs`.
- `docs/checkout/google-address-autocomplete.md`.

## Keyboard review fixes (2026-10-01)

Only the two independent keyboard review issues were corrected. Strict vertical
TDD evidence is in `/root/.hermes/cache/scratch/google-inline-fix-*.log`:

- `red-ime.log`: 10 groups passed, 3 failed. Composing ArrowDown was prevented
  (`true` instead of `false`); interim composition loaded the mocked SDK
  (1 request instead of 0); pending debounce reopened 2 options instead of 0.
- `green-ime.log`: all 13 groups passed after composition lifecycle and native
  keyboard guards, including deferred committed input and pending prediction/
  details invalidation.
- `red-enter.log`: 13 groups passed, 8 failed. The existing dismissal group and
  missing-key, necessary-only, query-failure, SDK-failure, Escape-dismissed,
  completed-selection and pending-query scenarios recorded 0 isolated native
  form submissions instead of 1. Composition remained green.
- `green-enter.log`: all 21 groups passed after limiting Enter prevention to
  the open suggestions menu, including no-active-option and active selection.

Composition events are simulated in Chromium; these checks do not establish
real OS/IME behavior. Native submission counts use only the isolated synthetic
form. No new submission test runs against CheckoutClient, and no order/payment
writes or real provider requests are made.

Fix files: `CheckoutStreetAddress.tsx`, `google-checkout.browser-test.mjs`, and
this document. Existing staged inline work is preserved; no dependency, API
mapping, CSP, environment, commit, push or deployment changes are included.

Final fix gates ran serially and exited 0: `final-tests.log` (185 files /
1,291 tests passed; 2 files / 22 tests skipped), `final-lint.log`,
`final-typecheck.log`, `final-unused.log` (815 files, 0 unreachable candidates),
and `final-browser.log` (21 mocked groups passed). `git diff --check` also passed.
