import { writeFile } from "node:fs/promises";
import { Pool } from "pg";

type TestStatus = "pass" | "fail" | "skip";

type TestResult = {
  name: string;
  expected: string;
  actual: string;
  status: TestStatus;
  issue?: string;
};

type ProductProbe = {
  id: string;
  slug: string;
  title: string;
};

const baseUrl = (process.env.QA_BASE_URL || "http://127.0.0.1:3000").replace(/\/$/, "");
const results: TestResult[] = [];

const addResult = (result: TestResult) => {
  results.push(result);
  const marker = result.status === "pass" ? "PASS" : result.status === "skip" ? "SKIP" : "FAIL";
  console.log(`[${marker}] ${result.name} - ${result.actual}`);
};

const fetchText = async (path: string, init?: RequestInit) => {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  return { response, text };
};

const getActiveProduct = async (): Promise<ProductProbe | null> => {
  if (!process.env.DATABASE_URL) return null;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const result = await pool.query<ProductProbe>(
      `SELECT id, slug, title
       FROM products
       WHERE is_active = true AND price > 0 AND slug IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 1`,
    );
    return result.rows[0] ?? null;
  } finally {
    await pool.end();
  }
};

const expectStatus = async (name: string, path: string, expectedStatus: number, init?: RequestInit) => {
  try {
    const { response } = await fetchText(path, init);
    addResult({
      name,
      expected: `HTTP ${expectedStatus}`,
      actual: `HTTP ${response.status}`,
      status: response.status === expectedStatus ? "pass" : "fail",
      issue: response.status === expectedStatus ? undefined : `Expected ${expectedStatus}, got ${response.status}`,
    });
  } catch (error) {
    addResult({
      name,
      expected: `HTTP ${expectedStatus}`,
      actual: error instanceof Error ? error.message : "Request failed",
      status: "fail",
      issue: "Request failed",
    });
  }
};

const expectContains = async (name: string, path: string, expectedText: string) => {
  try {
    const { response, text } = await fetchText(path);
    const passed = response.ok && text.includes(expectedText);
    addResult({
      name,
      expected: `HTTP 200 and content includes "${expectedText}"`,
      actual: `HTTP ${response.status}, contains=${passed}`,
      status: passed ? "pass" : "fail",
      issue: passed ? undefined : "Expected text missing",
    });
  } catch (error) {
    addResult({
      name,
      expected: `HTTP 200 and content includes "${expectedText}"`,
      actual: error instanceof Error ? error.message : "Request failed",
      status: "fail",
      issue: "Request failed",
    });
  }
};

const postJson = async (path: string, body: unknown) =>
  fetchText(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const run = async () => {
  const product = await getActiveProduct();

  await expectStatus("Homepage loads", "/de", 200);
  await expectStatus("Store page loads", "/de/store", 200);
  await expectStatus("Cart page loads", "/de/cart", 200);
  await expectStatus("Checkout page loads", "/de/checkout", 200);
  await expectStatus("Contact page loads", "/de/contact", 200);
  await expectStatus("Privacy page loads", "/de/privacy", 200);
  await expectStatus("Impressum page loads", "/de/impressum", 200);
  await expectStatus("Sitemap loads", "/sitemap.xml", 200);
  await expectStatus("Robots loads", "/robots.txt", 200);

  if (product) {
    await expectContains("Product detail loads", `/de/store/${product.slug}`, product.title);

    const validCart = await postJson("/api/cart/validate", {
      items: [{ productId: product.id, quantity: 1 }],
      shippingMethod: "pickup",
    });
    const validCartBody = JSON.parse(validCart.text) as { success?: boolean; cart?: { totalAmount?: number } };
    addResult({
      name: "Cart validation accepts active product",
      expected: "HTTP 200 and success=true",
      actual: `HTTP ${validCart.response.status}, success=${validCartBody.success}, total=${validCartBody.cart?.totalAmount ?? "-"}`,
      status: validCart.response.status === 200 && validCartBody.success ? "pass" : "fail",
      issue: validCart.response.status === 200 && validCartBody.success ? undefined : "Valid cart rejected",
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      const stripe = await postJson("/api/checkout/stripe", {
        items: [{ productId: product.id, quantity: 1 }],
        shippingMethod: "pickup",
        locale: "de",
        customer: { name: "QA Test", email: "qa@example.com" },
      });
      addResult({
        name: "Stripe missing config fails closed",
        expected: "HTTP 503 without creating checkout",
        actual: `HTTP ${stripe.response.status}`,
        status: stripe.response.status === 503 ? "pass" : "fail",
        issue: stripe.response.status === 503 ? undefined : "Stripe route did not fail closed",
      });
    } else {
      addResult({
        name: "Stripe missing config fails closed",
        expected: "Skipped when Stripe keys are configured",
        actual: "Stripe key configured; external sandbox test required",
        status: "skip",
      });
    }

    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      const paypal = await postJson("/api/checkout/paypal/create", {
        items: [{ productId: product.id, quantity: 1 }],
        shippingMethod: "pickup",
        locale: "de",
        customer: { name: "QA Test", email: "qa@example.com" },
      });
      addResult({
        name: "PayPal missing config fails closed",
        expected: "HTTP 400 without creating external checkout",
        actual: `HTTP ${paypal.response.status}`,
        status: paypal.response.status === 400 ? "pass" : "fail",
        issue: paypal.response.status === 400 ? undefined : "PayPal route did not fail closed",
      });
    } else {
      addResult({
        name: "PayPal missing config fails closed",
        expected: "Skipped when PayPal keys are configured",
        actual: "PayPal keys configured; external sandbox test required",
        status: "skip",
      });
    }
  } else {
    addResult({
      name: "Product-dependent tests",
      expected: "Active product in database",
      actual: "No active product found or DATABASE_URL missing",
      status: "skip",
    });
  }

  const emptyCart = await postJson("/api/cart/validate", { items: [] });
  addResult({
    name: "Empty cart rejected",
    expected: "HTTP 400",
    actual: `HTTP ${emptyCart.response.status}`,
    status: emptyCart.response.status === 400 ? "pass" : "fail",
    issue: emptyCart.response.status === 400 ? undefined : "Empty cart was not rejected",
  });

  const invalidContact = await postJson("/api/contact", {});
  addResult({
    name: "Invalid contact form rejected",
    expected: "HTTP 400",
    actual: `HTTP ${invalidContact.response.status}`,
    status: invalidContact.response.status === 400 ? "pass" : "fail",
    issue: invalidContact.response.status === 400 ? undefined : "Invalid contact form was not rejected",
  });

  const invalidRepair = await postJson("/api/repairs", {});
  addResult({
    name: "Invalid repair form rejected",
    expected: "HTTP 400",
    actual: `HTTP ${invalidRepair.response.status}`,
    status: invalidRepair.response.status === 400 ? "pass" : "fail",
    issue: invalidRepair.response.status === 400 ? undefined : "Invalid repair form was not rejected",
  });

  const crossSiteLogin = await fetchText("/api/admin/login", {
    method: "POST",
    headers: { Origin: "https://evil.example" },
    body: new URLSearchParams({ email: "admin@example.com", password: "wrong" }),
    redirect: "manual",
  });
  addResult({
    name: "Admin login rejects cross-site mutation",
    expected: "HTTP 403",
    actual: `HTTP ${crossSiteLogin.response.status}`,
    status: crossSiteLogin.response.status === 403 ? "pass" : "fail",
    issue: crossSiteLogin.response.status === 403 ? undefined : "Cross-site admin mutation was not blocked",
  });

  await expectStatus("Admin orders export requires auth", "/api/admin/orders/export", 401);

  const stripeWebhook = await fetchText("/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=bad" },
    body: JSON.stringify({ id: "evt_bad", type: "checkout.session.completed", data: { object: {} } }),
  });
  addResult({
    name: "Stripe webhook rejects bad/missing signature",
    expected: "HTTP 400 if configured or 503 if not configured",
    actual: `HTTP ${stripeWebhook.response.status}`,
    status: [400, 503].includes(stripeWebhook.response.status) ? "pass" : "fail",
    issue: [400, 503].includes(stripeWebhook.response.status) ? undefined : "Webhook accepted invalid request",
  });

  const paypalWebhook = await fetchText("/api/webhooks/paypal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: "WH-BAD", event_type: "PAYMENT.CAPTURE.COMPLETED", resource: {} }),
  });
  addResult({
    name: "PayPal webhook rejects unsigned/misconfigured request",
    expected: "HTTP 400 if configured or 503 if webhook verification is not configured",
    actual: `HTTP ${paypalWebhook.response.status}`,
    status: [400, 503].includes(paypalWebhook.response.status) ? "pass" : "fail",
    issue: [400, 503].includes(paypalWebhook.response.status) ? undefined : "Webhook accepted invalid request",
  });

  const failed = results.filter((result) => result.status === "fail");
  const markdown = [
    "# Production QA Test Matrix",
    "",
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    `Base URL: \`${baseUrl}\``,
    "",
    "| Test | Expected | Actual | Status | Issue |",
    "| --- | --- | --- | --- | --- |",
    ...results.map((result) =>
      `| ${result.name} | ${result.expected} | ${result.actual} | ${result.status.toUpperCase()} | ${result.issue ?? ""} |`,
    ),
    "",
    `Summary: ${results.length - failed.length}/${results.length} passed or skipped, ${failed.length} failed.`,
    "",
  ].join("\n");

  await writeFile("docs/production-test-matrix.md", markdown, "utf8");

  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

void run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
