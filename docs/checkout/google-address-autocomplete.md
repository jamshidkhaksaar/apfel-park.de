# Optional Google address search in checkout

The German and English checkout offer an optional Google Places (New)
PlaceAutocompleteElement immediately above the existing manual delivery fields.
Germany shipping only; pickup and an absent key show no panel. There is no map,
geometry request, second payment button, or legacy Autocomplete integration.

## Current decision: keep disabled

The user explicitly requires Google autocomplete to remain DISABLED in production.
GOOGLE_PLACES_BROWSER_API_KEY remains absent; this fix changes no runtime
configuration. The implementation agent does not deploy, restart, commit or push.
An operator may deploy the code safely with the feature disabled through the
normal release workflow; deployment is separate from activation.

## Enablement (future operator action, requiring a separate activation decision)

1. In the intended Google Cloud project, enable Maps JavaScript API and Places API
   (New), and configure billing, quotas and usage alerts.
2. Create a browser API key with Website / HTTP referrer restrictions for
   https://apfel-park.de/* and https://www.apfel-park.de/* (the checked-in nginx configuration lists and
   redirects this alias). Verify deployed hostnames before allowing aliases. Use a
   separate restricted key/project for any intentional test origin.
3. Restrict the key to Maps JavaScript API and Places API (New).
4. In the runtime service environment, set GOOGLE_PLACES_BROWSER_API_KEY. The
   dynamic checkout page trims it and passes it to the browser. Do not use the
   map embed key or a NEXT_PUBLIC fallback. Never commit keys or print them in
   logs. No env file or runtime configuration was changed for this implementation.

Browser keys are visible to browser users and in network requests. Environment
configuration prevents committing a key; it does not make it a browser secret.
Google's referrer/API restrictions, quotas and monitoring enforce its intended
use. Do not enable this service with an unrestricted key.

## Privacy and manual fallback

The panel describes the transmission of search/address input and network data
(including IP address) and links to the localized privacy page. Loading requires
a separate explicit activation in this checkout session. Global external or
marketing consent never enables this widget automatically, and activation does
not change that global consent. The disable control, pickup switch, component
unmount and the existing consent withdrawal notification remove the widget and
invalidate pending work. React StrictMode cleanup does not remove a shared SDK.
A new explicit activation is required to resume.

SDK gm_authFailure monitoring remains subscribed throughout active widget
lifetimes, including after importLibrary resolves. A late auth failure notifies
all active consumers, invalidates cached readiness, removes their widgets and
announces the existing localized manual fallback without changing manual inputs.
The next explicit activation imports Places afresh; it does not unload a shared
successful SDK. Subscriptions are cleaned on disable, withdrawal, pickup and
unmount. The shared monitor chains the previous auth handler and restores it when
the last subscriber leaves, without overwriting another component's replacement.

A SDK script already requested after opt-in remains shared: disabling removes
the widget and ignores late initialization/details; it cannot recall prior
transmissions or reliably cancel an in-flight network request. No key, pickup,
or a fresh page before activation creates no Google request from this feature.

Only addressComponents are fetched. Complete German route + house number +
five-digit postcode + city + DE addresses fill the three manual fields. Name,
email, phone and optional line2 are preserved. Incomplete/foreign addresses,
SDK/auth errors, timeouts and detail errors leave manual entry available.
Newer selections and manual typing take precedence over pending details.
Autofill uses the checkout's existing field-update path, including payment
state invalidation and idempotency renewal.

Default German/English privacy copy includes factual information for this
optional service. Database privacy overrides were not changed. Before enabling,
review the actual published policy (an override can supersede these defaults),
provider/privacy disclosures and your own configuration; this change makes no
legal-compliance guarantee.

## Checkout CSP and activation checks

The unchanged global CSP remains first in next.config.ts. Later overrides apply
only to exact /de/checkout and /en/checkout, retaining every base directive and
Stripe/PayPal protection. They append only these sources:

- script-src: https://maps.googleapis.com and https://maps.gstatic.com.
- connect-src: https://maps.googleapis.com, https://places.googleapis.com and
  https://maps.gstatic.com.
- style-src: https://fonts.googleapis.com.
- font-src: https://fonts.gstatic.com.

The existing Maps image sources remain unchanged. No unsafe-eval, wildcard or
broad scheme is added. Other routes, including checkout children, retain the base
policy. Unit tests assert the header entry order and exact directive additions;
the isolated MOCKED fixture serves these configured policies as HTTP headers.
It does not prove Next.js/deployed proxy header precedence or real SDK compatibility.

Before any separately authorized activation, validate live response headers for
both checkout URLs and representative other routes, including any proxy CSP.
Then use a confirmed restricted key to validate real provider/CSP compatibility,
SDK authorization, widget readiness and fallback in the browser. These checks
remain outstanding; mock success is not provider readiness. If the provider
requires unsafe-eval, activation remains blocked pending a separate security
decision; do not automatically relax CSP. Google's CSP guidance recommends nonce
based strict policies; its broader examples must not be copied as blanket
allowlist relaxations:
https://developers.google.com/maps/documentation/javascript/content-security-policy.

## Local validation

- npm test: mapper fixtures, singleton loader failure/retry tests, runtime prop,
  localized default privacy and checkout render tests, plus existing suite.
- npm run lint; npm run typecheck; npm run audit:unused.
- node scripts/google-checkout.browser-test.mjs: isolated React StrictMode fixture,
  MOCKED SDK/network; intercepted Google script requests only. Covers opt-in,
  pickup, missing key, autofill/manual editing, incomplete/foreign rejection,
  detail failures, SDK network/auth failure and timeout, late SDK auth failure after readiness,
  configured CSP headers, explicit fresh retry, out-of-order selection,
  manual edits during pending details, disable, withdrawal, pickup, unmount and
  late initialization. Native form submission behavior is tested with a fixture
  submit button, not an order or payment request.

The script defaults to installed Playwright at
/root/apfel-audit/browser/node_modules/playwright/index.mjs and Chromium at
/root/.cache/puppeteer/chrome/linux-152.0.7977.75/chrome-linux64/chrome.
PLAYWRIGHT_MODULE may specify an alternate Playwright module path.
No real Google/provider success is asserted. All red/green and final validation
logs are under /root/.hermes/cache/scratch/google-checkout-*.log.

## Rollback

Unset the dedicated runtime key through the normal authorized configuration
workflow to hide the panel. The original manual address and payment flow remain
available. Code rollback can remove this panel and runtime prop through the
normal release process. This task does not deploy, restart, commit or push.

## API references verified

- https://developers.google.com/maps/documentation/javascript/place-autocomplete-new
- https://developers.google.com/maps/documentation/javascript/reference/places-widget
- https://developers.google.com/maps/documentation/javascript/load-maps-js-api

Current widget options include includedRegionCodes and requestedLanguage;
selection uses gmp-select, placePrediction.toPlace(), and
fetchFields({fields: ['addressComponents']}). gmp-error reports backend denial.

The async SDK uses an explicit readiness callback; its script load event alone
is not assumed to mean Maps is ready. The shared loader rejects after 15 seconds.

## Earlier implementation evidence (2026-10-01, before these two fixes)

Final local validation passed on Node v24.14.0:
185 test files passed, 2 skipped; 1,288 tests passed, 22 skipped.
All 7 MOCKED browser groups passed. Lint and strict typecheck passed;
the unused-source audit reported 0 unreachable source candidates.

Final logs:
- /root/.hermes/cache/scratch/google-checkout-final-tests.log
- /root/.hermes/cache/scratch/google-checkout-final-browser.log
- /root/.hermes/cache/scratch/google-checkout-final-lint.log
- /root/.hermes/cache/scratch/google-checkout-final-typecheck.log
- /root/.hermes/cache/scratch/google-checkout-final-unused.log

TDD red/green pairs:
- google-checkout-mapper-red.log / google-checkout-mapper-green.log
- google-checkout-mapper-validation-red.log / google-checkout-mapper-validation-green.log
- google-checkout-loader-red.log / google-checkout-loader-green.log
- google-checkout-loader-readiness-red.log / google-checkout-loader-readiness-green.log
- google-checkout-loader-callback-red.log / google-checkout-loader-callback-green.log
- google-checkout-browser-behavior-red.log / google-checkout-browser-green.log
- google-checkout-integration-red.log / google-checkout-integration-green.log

All pair filenames above reside in /root/.hermes/cache/scratch/.
The browser red run exercised a null component skeleton; the earlier missing-module
build failure is also captured in google-checkout-browser-red.log.
The integration first-attempt log records a corrected SSR attribute-case assertion.
The typecheck callback red log records the corrected assertion of the external
browser-global shape. These are local evidence, not production verification.

Edited files:
- src/app/(site)/[lang]/checkout/page.tsx
- src/components/checkout/CheckoutClient.tsx
- src/components/checkout/GoogleAddressSearch.tsx
- src/lib/i18n.ts
- src/lib/google-places-address.ts
- src/lib/google-places-loader.ts
- src/lib/__tests__/google-places-address.test.ts
- src/lib/__tests__/google-places-loader.test.ts
- src/lib/__tests__/google-places-checkout.test.ts
- scripts/google-checkout.browser-test.mjs
- docs/checkout/google-address-autocomplete.md

## Two-issue fix evidence (2026-10-01)

Tests were written and run failing before the corresponding implementation:

- google-checkout-fix-unit-red.log: 3 failed, 9 passed (missing lifetime
  subscription API and missing checkout CSP overrides).
- google-checkout-fix-unit-green.log: 12 passed.
- google-checkout-fix-browser-red.log: late auth failure failed because the
  mounted widget remained; the other 7 groups passed.
- google-checkout-fix-browser-green.log: all 8 groups passed.
- google-checkout-fix-csp-browser-red.log: fixture CSP response-header assertion
  failed because the fixture served no CSP; the other 8 groups passed.
- google-checkout-fix-csp-browser-green.log: all 9 groups passed with configured
  CSP headers and fresh-import assertions.

All filenames above reside in /root/.hermes/cache/scratch/.
Final checks ran serially on Node v24.14.0 and all exited 0:

- /root/.hermes/cache/scratch/google-checkout-fix-final-targeted.log:
  4 files, 32 tests passed (loader, mapper, checkout and CSP).
- /root/.hermes/cache/scratch/google-checkout-fix-final-tests.log:
  185 files passed, 2 skipped; 1,291 tests passed, 22 skipped.
- /root/.hermes/cache/scratch/google-checkout-fix-final-lint.log: passed.
- /root/.hermes/cache/scratch/google-checkout-fix-final-typecheck.log: passed.
- /root/.hermes/cache/scratch/google-checkout-fix-final-unused.log:
  815 files checked, 0 unreachable source candidates. The audit still lists
  computed module loading for manual review, including the browser fixture.
- /root/.hermes/cache/scratch/google-checkout-fix-final-browser.log:
  all 9 MOCKED browser groups passed.

Files edited for these two fixes only:

- src/lib/google-places-loader.ts
- src/components/checkout/GoogleAddressSearch.tsx
- next.config.ts
- src/lib/__tests__/google-places-loader.test.ts
- src/lib/__tests__/content-security-policy.test.ts
- scripts/google-checkout.browser-test.mjs
- docs/checkout/google-address-autocomplete.md

No deployment, commit, push, runtime/environment configuration change or real
provider request was made. Production activation and real provider readiness
have not been validated; the explicit keep-disabled decision remains in force.
