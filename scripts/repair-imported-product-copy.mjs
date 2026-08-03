import { mkdir, writeFile } from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

const colorsDe = {
  Black: "Schwarz", White: "Weiß", Blue: "Blau", Green: "Grün", Yellow: "Gelb",
  Pink: "Pink", Purple: "Violett", Orange: "Orange", Silver: "Silber", Gold: "Gold",
  Gray: "Grau", Grey: "Grau", Red: "Rot", Navy: "Dunkelblau", Mint: "Mint",
};

const conditionCopy = {
  new: {
    de: "Neu und originalverpackt.", en: "New and factory sealed.", labelDe: "Neu", labelEn: "New",
  },
  open_box: {
    de: "Als Open-Box-Gerät angeboten.", en: "Offered as an open-box device.", labelDe: "Open-Box", labelEn: "Open-box",
  },
  used: {
    de: "Als gebrauchtes Gerät angeboten.", en: "Offered as a used device.", labelDe: "Gebraucht", labelEn: "Used",
  },
};

const clean = (value) => typeof value === "string" ? value.trim() : "";
const sentence = (title, storage, color, locale) => {
  const localizedColor = locale === "de" ? (colorsDe[color] ?? color) : color;
  if (storage && localizedColor) {
    return locale === "de"
      ? `${title} in ${localizedColor} mit ${storage} Speicher.`
      : `${title} in ${localizedColor} with ${storage} of storage.`;
  }
  if (storage) return locale === "de" ? `${title} mit ${storage} Speicher.` : `${title} with ${storage} of storage.`;
  if (localizedColor) return `${title} in ${localizedColor}.`;
  return `${title}.`;
};

const variedDescription = ({ title, storage, color, colorDe, condition, warranty, variant, locale }) => {
  const storageDe = storage ? `${storage} Speicher` : "";
  const storageEn = storage ? `${storage} of storage` : "";
  const configurationDe = [storageDe, colorDe ? `Farbe ${colorDe}` : ""].filter(Boolean).join(" und ");
  const configurationEn = [storageEn, color ? `${color} finish` : ""].filter(Boolean).join(" and ");
  const leadsDe = [
    sentence(title, storage, color, "de"),
    configurationDe ? `Angeboten wird das ${title} mit ${configurationDe}.` : `${title}, erhältlich bei Apfel Park.`,
    configurationDe ? `${title}: ${configurationDe}.` : `${title} aus unserem aktuellen Sortiment.`,
    configurationDe ? `Dieses ${title} kommt mit ${configurationDe}.` : `Dieses ${title} ist aktuell bei Apfel Park erhältlich.`,
  ];
  const leadsEn = [
    sentence(title, storage, color, "en"),
    configurationEn ? `This ${title} is offered with ${configurationEn}.` : `${title}, available from Apfel Park.`,
    configurationEn ? `${title}: ${configurationEn}.` : `${title} from our current selection.`,
    configurationEn ? `This ${title} comes with ${configurationEn}.` : `This ${title} is currently available from Apfel Park.`,
  ];
  const serviceDe = [
    "Abholung in Hamburg oder Versand innerhalb Deutschlands.",
    "Online bestellen oder direkt bei Apfel Park in Hamburg abholen.",
    "Versand innerhalb Deutschlands ist möglich; alternativ steht die Abholung in Hamburg zur Verfügung.",
    "Bei Apfel Park online bestellen oder in Hamburg abholen.",
  ];
  const serviceEn = [
    "Collection in Hamburg or delivery within Germany.",
    "Order online or collect directly from Apfel Park in Hamburg.",
    "Delivery within Germany is available, with collection in Hamburg as an alternative.",
    "Order online from Apfel Park or collect in Hamburg.",
  ];
  if (locale === "de") {
    return `${leadsDe[variant]} ${condition.de}${warranty ? " Inklusive 12 Monate Garantie." : ""} ${serviceDe[variant]}`;
  }
  return `${leadsEn[variant]} ${condition.en}${warranty ? " Includes a 12-month warranty." : ""} ${serviceEn[variant]}`;
};

await client.connect();
try {
  const { rows } = await client.query(`
    SELECT id,title,brand,model,condition,import_metadata,title_i18n,subtitle_i18n,
           description_i18n,feature_bullets_i18n,subtitle,description,feature_bullets
    FROM products WHERE import_key IS NOT NULL ORDER BY created_at
  `);
  const backupDir = "/srv/apfel-park/app/shared/backups";
  await mkdir(backupDir, { recursive: true });
  const backupPath = `${backupDir}/imported-product-copy-before-repair-${new Date().toISOString().replaceAll(":", "-")}.json`;
  await writeFile(backupPath, JSON.stringify(rows, null, 2), { mode: 0o600 });

  await client.query("BEGIN");
  let active = 0;
  for (const row of rows) {
    const evidence = row.import_metadata?.evidence ?? {};
    const storage = clean(evidence.storage);
    const color = clean(evidence.color);
    const warranty = clean(evidence.warranty);
    const colorDe = colorsDe[color] ?? color;
    const condition = conditionCopy[row.condition] ?? conditionCopy.open_box;
    const subtitleDe = [storage, colorDe, condition.labelDe].filter(Boolean).join(" · ");
    const subtitleEn = [storage, color, condition.labelEn].filter(Boolean).join(" · ");
    const variant = Number.parseInt(String(row.id).slice(0, 2), 16) % 4;
    const descriptionDe = variedDescription({ title: row.title, storage, color, colorDe, condition, warranty, variant, locale: "de" });
    const descriptionEn = variedDescription({ title: row.title, storage, color, colorDe, condition, warranty, variant, locale: "en" });
    const bulletsDe = [
      storage ? `Speicher: ${storage}` : null,
      colorDe ? `Farbe: ${colorDe}` : null,
      `Zustand: ${condition.labelDe}`,
      warranty ? "12 Monate Garantie" : null,
      "Abholung in Hamburg oder Versand",
    ].filter(Boolean);
    const bulletsEn = [
      storage ? `Storage: ${storage}` : null,
      color ? `Color: ${color}` : null,
      `Condition: ${condition.labelEn}`,
      warranty ? "12-month warranty" : null,
      "Collection in Hamburg or delivery",
    ].filter(Boolean);

    await client.query(
      `UPDATE products SET
         subtitle=$2, description=$3, feature_bullets=$4,
         subtitle_i18n=$5::jsonb, description_i18n=$6::jsonb, feature_bullets_i18n=$7::jsonb,
         condition_note=CASE WHEN condition_note ILIKE '%Automatische Prüfung:%' OR condition_note ILIKE '%automatic draft%' THEN '' ELSE condition_note END
       WHERE id=$1`,
      [
        row.id, subtitleDe, descriptionDe, bulletsDe,
        JSON.stringify({ de: subtitleDe, en: subtitleEn }),
        JSON.stringify({ de: descriptionDe, en: descriptionEn }),
        JSON.stringify({ de: bulletsDe, en: bulletsEn }),
      ],
    );
    active += 1;
  }
  await client.query("COMMIT");
  console.log(JSON.stringify({ updated: active, backupPath }));
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}
