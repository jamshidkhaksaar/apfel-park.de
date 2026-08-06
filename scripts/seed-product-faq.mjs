#!/usr/bin/env node
/**
 * Seeds a baseline FAQ for smartphones and tablets that have none yet.
 *
 * The questions are shop-level facts (condition, warranty, pickup, payment,
 * battery health) built from each product's own data -- no invented specs.
 * Manually edited FAQs are never overwritten: only rows with faq IS NULL are
 * touched, and the admin editor can extend or replace the seeded entries.
 *
 *   node scripts/seed-product-faq.mjs           dry run
 *   node scripts/seed-product-faq.mjs --apply   writes
 */
import pg from "pg";

const APPLY = process.argv.includes("--apply");
if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const { rows } = await client.query(`
  SELECT id, title, condition, battery_health
  FROM products
  WHERE category IN ('smartphones', 'tablets') AND faq IS NULL
`);

const buildFaq = (row) => {
  const name = row.title.trim();
  const used = row.condition === "used";
  const openBox = row.condition === "open_box";

  const de = [];
  const en = [];

  if (used) {
    de.push({
      q: `In welchem Zustand ist das ${name}?`,
      a: "Das Gerät ist gebraucht in Zustand A+, von unserer Werkstatt geprüft und mit echten Fotos des Geräts dokumentiert. Den genauen Zustand finden Sie in der Produktbeschreibung.",
    });
    en.push({
      q: `What condition is the ${name} in?`,
      a: "The device is used in A+ condition, tested by our workshop and documented with real photos of the exact device. The precise condition is described on this page.",
    });
  } else if (openBox) {
    de.push({
      q: `Was bedeutet Open-Box beim ${name}?`,
      a: "Das Gerät wurde nur ausgepackt bzw. kurz vorgeführt, ist technisch neuwertig und von uns geprüft. Der Lieferumfang ist in der Produktbeschreibung dokumentiert.",
    });
    en.push({
      q: `What does open-box mean for the ${name}?`,
      a: "The device was only unboxed or briefly demonstrated, is technically as new and tested by us. The included accessories are documented in the description.",
    });
  } else {
    de.push({
      q: `Ist das ${name} neu und originalverpackt?`,
      a: "Ja, das Gerät ist neu, originalverpackt und versiegelt.",
    });
    en.push({
      q: `Is the ${name} new and sealed?`,
      a: "Yes, the device is brand new, in its original packaging and sealed.",
    });
  }

  if (used && row.battery_health) {
    de.push({
      q: "Wie ist der Akkuzustand?",
      a: `Die gemessene Batteriekapazität beträgt ${row.battery_health}%.`,
    });
    en.push({
      q: "What is the battery health?",
      a: `The measured battery capacity is ${row.battery_health}%.`,
    });
  }

  de.push({
    q: "Welche Garantie und welches Rückgaberecht habe ich?",
    a: used
      ? "Sie haben 14 Tage Widerrufsrecht und 12 Monate Gewährleistung auf Gebrauchtgeräte."
      : "Sie haben 14 Tage Widerrufsrecht und 24 Monate gesetzliche Gewährleistung.",
  });
  en.push({
    q: "What warranty and return rights do I have?",
    a: used
      ? "You have a 14-day right of withdrawal and a 12-month warranty on used devices."
      : "You have a 14-day right of withdrawal and the 24-month statutory warranty.",
  });

  de.push({
    q: "Kann ich das Gerät in Hamburg abholen?",
    a: "Ja, Abholung in unserem Store in Hamburg-Wilhelmsburg, Montag bis Samstag 09:30–20:00 Uhr. Alternativ versenden wir versichert innerhalb Deutschlands, Zustellung in 1–3 Werktagen.",
  });
  en.push({
    q: "Can I pick the device up in Hamburg?",
    a: "Yes, pickup at our store in Hamburg-Wilhelmsburg, Monday to Saturday 9:30–20:00. We also ship insured within Germany, delivered in 1–3 business days.",
  });

  de.push({
    q: "Wie kann ich bezahlen?",
    a: "Online per Karte oder PayPal, bei Abholung im Store auch bar oder mit Karte. Alle Preise enthalten die gesetzliche MwSt.",
  });
  en.push({
    q: "How can I pay?",
    a: "Online by card or PayPal; in store also cash or card on pickup. All prices include VAT.",
  });

  return { de, en };
};

console.log(`${rows.length} smartphones/tablets without FAQ`);
if (!APPLY) {
  if (rows[0]) {
    console.log("\nexample for:", rows[0].title);
    console.log(JSON.stringify(buildFaq(rows[0]).de.map((e) => e.q), null, 1));
  }
  console.log("\ndry run -- pass --apply to write");
  await client.end();
  process.exit(0);
}

await client.query("BEGIN");
for (const row of rows) {
  await client.query(`UPDATE products SET faq = $2 WHERE id = $1`, [row.id, JSON.stringify(buildFaq(row))]);
}
await client.query("COMMIT");
console.log(`seeded ${rows.length} products`);
await client.end();
