# Payment Sandbox Test Log

Date: 2026-05-12

## Environment Checklist

- `PAYMENT_MODE=sandbox`
- `SHOP_CURRENCY=EUR`
- `SHOP_VAT_RATE=19`
- `STRIPE_SECRET_KEY` set to a Stripe test secret key
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set to a Stripe test publishable key
- `STRIPE_WEBHOOK_SECRET` set from the Stripe CLI or dashboard endpoint
- `PAYPAL_CLIENT_ID` set to a PayPal sandbox app client ID
- `PAYPAL_CLIENT_SECRET` set to a PayPal sandbox app secret
- `PAYPAL_WEBHOOK_ID` set from the PayPal sandbox webhook; PayPal webhook processing fails closed without it

## Stripe Sandbox

1. Add a product to cart from `/de/store/[slug]`.
2. Open `/de/checkout`, enter customer details, choose pickup, and pay by card.
3. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.
4. Confirm redirect to `/de/checkout/success`.
5. Confirm the `orders` row is `status=paid`, `payment_status=paid`, and has `provider_session_id`.
6. Replay the same webhook and confirm no duplicate webhook processing.
7. Start checkout again and cancel at Stripe; confirm cancel page and unpaid/pending order.

Result: pending manual sandbox credentials.

## PayPal Sandbox

1. Add a product to cart and open checkout.
2. Pay with PayPal sandbox buyer account.
3. Confirm redirect to `/checkout/success?provider=paypal&token=...`.
4. Confirm capture API marks the order paid.
5. Confirm webhook replay is ignored by `payment_webhook_events`.
6. Cancel from PayPal and confirm order remains unpaid.

Result: pending manual sandbox credentials.

## Analytics

1. Accept external services in the cookie banner.
2. Verify `page_view`, `view_item`, `add_to_cart`, and `begin_checkout` in browser/network tooling.
3. Complete sandbox payment and verify `purchase` only after provider confirmation.
4. Confirm no purchase event fires on cancel pages or unpaid success pages.

Result: pending real test IDs and consent-enabled browser QA.
