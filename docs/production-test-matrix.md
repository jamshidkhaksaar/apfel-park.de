# Production QA Test Matrix

Date: 2026-05-13
Base URL: `http://127.0.0.1:3000`

| Test | Expected | Actual | Status | Issue |
| --- | --- | --- | --- | --- |
| Homepage loads | HTTP 200 | HTTP 200 | PASS |  |
| Store page loads | HTTP 200 | HTTP 200 | PASS |  |
| Cart page loads | HTTP 200 | HTTP 200 | PASS |  |
| Checkout page loads | HTTP 200 | HTTP 200 | PASS |  |
| Contact page loads | HTTP 200 | HTTP 200 | PASS |  |
| Privacy page loads | HTTP 200 | HTTP 200 | PASS |  |
| Impressum page loads | HTTP 200 | HTTP 200 | PASS |  |
| Sitemap loads | HTTP 200 | HTTP 200 | PASS |  |
| Robots loads | HTTP 200 | HTTP 200 | PASS |  |
| Product detail loads | HTTP 200 and content includes "iphone 15 Pro Max- Titan weiß" | HTTP 200, contains=true | PASS |  |
| Cart validation accepts active product | HTTP 200 and success=true | HTTP 200, success=true, total=879 | PASS |  |
| Stripe missing config fails closed | HTTP 503 without creating checkout | HTTP 503 | PASS |  |
| PayPal missing config fails closed | HTTP 400 without creating external checkout | HTTP 400 | PASS |  |
| Empty cart rejected | HTTP 400 | HTTP 400 | PASS |  |
| Invalid contact form rejected | HTTP 400 | HTTP 400 | PASS |  |
| Invalid repair form rejected | HTTP 400 | HTTP 400 | PASS |  |
| Admin login rejects cross-site mutation | HTTP 403 | HTTP 403 | PASS |  |
| Admin orders export requires auth | HTTP 401 | HTTP 401 | PASS |  |
| Stripe webhook rejects bad/missing signature | HTTP 400 if configured or 503 if not configured | HTTP 503 | PASS |  |
| PayPal webhook rejects unsigned/misconfigured request | HTTP 400 if configured or 503 if webhook verification is not configured | HTTP 503 | PASS |  |

Summary: 20/20 passed or skipped, 0 failed.
