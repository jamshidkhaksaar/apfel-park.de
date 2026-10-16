import { randomUUID } from 'node:crypto';
import {
  channels,
  entryProblems,
  entryReadiness,
  newPhoneDocument,
  newPhoneEntry,
  type PhoneDocument,
  type PhoneEntry,
} from '@/lib/smartphone-editor/model';
import { validatedGtin } from '@/lib/product-identifiers';
import { findSensitiveDataIssues } from '@/lib/product-intake/redaction';

export const categories = [
  'smartphones',
  'tablets',
  'laptops',
  'consoles',
  'accessories',
  'parts',
] as const;
export type Locale = 'de' | 'en';
export type Stage =
  | 'category'
  | 'brand'
  | 'model'
  | 'condition'
  | 'researching'
  | 'versions'
  | 'color'
  | 'storage'
  | 'configuration'
  | 'price'
  | 'stock'
  | 'identical'
  | 'battery'
  | 'notes'
  | 'accessories'
  | 'presentation'
  | 'photos'
  | 'information'
  | 'gtin'
  | 'mpn'
  | 'channels'
  | 'review';
export type Conversation = {
  stage: Stage;
  entryId: string;
  locale: Locale;
  page: number;
  sources: Array<{ url: string; title: string; retrievedAt: string }>;
  warnings: string[];
  condition: PhoneEntry['condition'];
  researchError?: string;
  updateOnly?: boolean;
  photoKind:
    | 'device'
    | 'box'
    | 'barcode_label'
    | 'about_screen'
    | 'battery_health';
};
export type Button = { text: string; action: string };
export type BotView = {
  text: string;
  buttons: Button[][];
  revision: number;
  sessionId?: string;
  pending?: boolean;
  photos?: Array<{ id: string; label: string }>;
};
export type Action = { action: string; text?: string };
export const tr = (locale: Locale, de: string, en: string): string =>
  locale === 'de' ? de : en;
export const newConversation = (
  locale: Locale,
): { state: Conversation; document: PhoneDocument } => {
  const document = newPhoneDocument();
  document.entries[0].channels = ['store'];
  document.entries[0].stock = 0;
  return {
    document,
    state: {
      stage: 'category',
      entryId: document.entries[0].id,
      locale,
      page: 0,
      sources: [],
      warnings: [],
      condition: 'new',
      photoKind: 'device',
    },
  };
};
export const currentEntry = (
  document: PhoneDocument,
  state: Conversation,
): PhoneEntry => {
  const entry = document.entries.find((e) => e.id === state.entryId);
  if (!entry) throw new Error('entry_not_found');
  return entry;
};
export const versionLabel = (entry: PhoneEntry): string =>
  [
    entry.color,
    entry.storage,
    ...Object.values(entry.configuration ?? {}),
    entry.condition,
    entry.batteryHealth == null ? '' : `${entry.batteryHealth}%`,
  ]
    .filter(Boolean)
    .join(' · ');
export const telegramBlockers = (
  doc: PhoneDocument,
  locale: Locale,
): string[] =>
  doc.entries.flatMap((entry) => [
    ...entryProblems(doc, entry, locale).map(
      (p) => `${versionLabel(entry)}: ${p.message}`,
    ),
    ...(!entry.hasRealProductPhotos
      ? [
          tr(
            locale,
            'Ein echtes Gerätefoto bestätigen.',
            'Confirm an actual device photo.',
          ),
        ]
      : []),
    ...(!entry.channels.length
      ? [
          tr(
            locale,
            'Einen Verkaufskanal auswählen.',
            'Select a selling channel.',
          ),
        ]
      : []),
    ...entry.channels.flatMap((channel) =>
      entryReadiness(doc, entry)[channel].errors.map(
        (error) => `${versionLabel(entry)} · ${channel}: ${error}`,
      ),
    ),
  ]);
const jumpStages: Stage[] = [
  'model',
  'versions',
  'presentation',
  'photos',
  'information',
  'channels',
  'review',
];
export const transition = (
  original: Conversation,
  originalDoc: PhoneDocument,
  input: Action,
): {
  state: Conversation;
  document: PhoneDocument;
  research?: boolean;
  submit?: boolean;
  cancel?: boolean;
} => {
  const state = structuredClone(original),
    document = structuredClone(originalDoc);
  const entry = currentEntry(document, state),
    text = input.text?.trim() ?? '';
  if (text.length > 2000 || findSensitiveDataIssues({ text }).length)
    throw new Error('private_or_invalid_input');
  if (input.action === 'cancel') return { state, document, cancel: true };
  if (input.action === 'save' || input.action === 'resume')
    return { state, document };
  if (
    input.action.startsWith('page:') &&
    ['versions', 'photos', 'channels'].includes(state.stage)
  ) {
    const page = Number(input.action.slice(5));
    if (!Number.isInteger(page) || page < 0 || page > 50)
      throw new Error('invalid_action');
    state.page = page;
    return { state, document };
  }
  if (state.stage === 'channels' && input.action.startsWith('channelEntry:')) {
    const id = input.action.slice(13);
    if (!document.entries.some((e) => e.id === id))
      throw new Error('invalid_action');
    state.entryId = id;
    return { state, document };
  }
  if (state.stage === 'channels' && input.action.startsWith('channel:')) {
    const channel = channels.find((c) => c === input.action.slice(8));
    if (!channel) throw new Error('invalid_action');
    entry.channels = entry.channels.includes(channel)
      ? entry.channels.filter((c) => c !== channel)
      : [...entry.channels, channel];
    return { state, document };
  }
  if (
    input.action.startsWith('setCondition:') &&
    ['color', 'price'].includes(state.stage)
  ) {
    const condition = input.action.slice(13);
    if (!['new', 'open_box', 'used'].includes(condition))
      throw new Error('invalid_action');
    entry.condition = condition as PhoneEntry['condition'];
    if (condition !== 'new' && entry.experience)
      entry.experience.packageContents = [];
    return { state, document };
  }
  if (input.action.startsWith('edit:')) {
    const stage = input.action.slice(5) as Stage;
    if (!jumpStages.includes(stage)) throw new Error('invalid_action');
    state.stage = stage;
    state.page = 0;
    document.step = jumpStages.indexOf(stage);
    return { state, document };
  }
  if (input.action === 'back') {
    const sequence: Stage[] = [
      'category',
      'brand',
      'model',
      'condition',
      'versions',
      'color',
      'storage',
      'configuration',
      'price',
      'stock',
      'battery',
      'notes',
      'accessories',
      'presentation',
      'photos',
      'information',
      'gtin',
      'mpn',
      'channels',
      'review',
    ];
    state.stage =
      sequence[Math.max(0, sequence.indexOf(state.stage) - 1)] ?? 'model';
    return { state, document };
  }
  if (input.action.startsWith('entry:')) {
    if (state.stage !== 'versions') throw new Error('invalid_action');
    const target = document.entries.find((e) => e.id === input.action.slice(6));
    if (!target) throw new Error('invalid_action');
    state.entryId = target.id;
    state.stage = 'color';
    return { state, document };
  }
  const value = input.action.startsWith('choose:')
    ? input.action.slice(7)
    : text;
  switch (state.stage) {
    case 'category':
      if (!categories.includes(value as (typeof categories)[number]))
        throw new Error('invalid_action');
      document.shared.category = value;
      state.stage = 'brand';
      break;
    case 'brand':
      if (!value || value.length > 80) throw new Error('invalid_input');
      document.shared.brand = value;
      state.stage = 'model';
      break;
    case 'model':
      if (!value || value.length > 120) throw new Error('invalid_input');
      document.shared.model = value;
      document.shared.title = `${document.shared.brand} ${value}`;
      state.stage = 'condition';
      break;
    case 'condition':
      if (!['new', 'open_box', 'used'].includes(value))
        throw new Error('invalid_action');
      state.condition = value as Conversation['condition'];
      entry.condition = state.condition;
      state.stage = 'researching';
      delete state.researchError;
      return { state, document, research: true };
    case 'researching':
      if (input.action === 'manual') state.stage = 'versions';
      else if (input.action === 'retry') {
        delete state.researchError;
        return { state, document, research: true };
      } else throw new Error('invalid_action');
      break;
    case 'versions': {
      if (input.action === 'retry') {
        state.stage = 'researching';
        delete state.researchError;
        return { state, document, research: true };
      }
      if (input.action.startsWith('page:')) {
        const p = Number(input.action.slice(5));
        if (!Number.isInteger(p) || p < 0 || p > 50)
          throw new Error('invalid_action');
        state.page = p;
        break;
      }
      if (input.action === 'next') {
        state.stage = 'presentation';
        document.step = 2;
        break;
      }
      if (document.entries.length >= 100) throw new Error('too_many_entries');
      const untouched =
        entry.price === 0 &&
        !entry.color &&
        !entry.storage &&
        !entry.photos.some((p) => p.url);
      const target = untouched ? entry : newPhoneEntry();
      target.stock = 0;
      target.channels = ['store'];
      target.condition = state.condition;
      if (input.action.startsWith('variant:')) {
        const option =
          document.variantSuggestions?.[Number(input.action.slice(8))];
        if (!option) throw new Error('invalid_action');
        target.color = option.color;
        target.storage = option.storage;
        target.configuration = option.configuration;
      } else if (input.action !== 'add') throw new Error('invalid_action');
      if (!untouched) document.entries.push(target);
      state.entryId = target.id;
      state.stage = target.color && target.storage ? 'price' : 'color';
      document.step = 1;
      break;
    }
    case 'color':
      entry.color = value === '-' ? '' : value.slice(0, 80);
      state.stage = 'storage';
      break;
    case 'storage':
      entry.storage = value === '-' ? '' : value.slice(0, 80);
      state.stage = 'configuration';
      break;
    case 'configuration':
      entry.configuration =
        value === '-'
          ? (entry.configuration ?? {})
          : Object.fromEntries(
              value.split('\n').map((line) => {
                const i = line.indexOf(':');
                if (i < 1) throw new Error('configuration_format');
                return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
              }),
            );
      state.stage = 'price';
      break;
    case 'price': {
      if (!/^\d{1,7}(?:[.,]\d{1,2})?$/.test(value.replace(/\s*€$/, '')))
        throw new Error('invalid_price');
      const price = Number(value.replace(/\s*€$/, '').replace(',', '.'));
      if (!(price > 0)) throw new Error('invalid_price');
      entry.price = price;
      state.stage = 'stock';
      break;
    }
    case 'stock':
      if (!/^\d{1,6}$/.test(value)) throw new Error('invalid_quantity');
      entry.stock = Number(value);
      state.stage = state.updateOnly
        ? 'review'
        : entry.condition !== 'new' && entry.stock > 1
          ? 'identical'
          : entry.condition === 'used' &&
              /iphone/i.test(`${document.shared.model}`)
            ? 'battery'
            : 'notes';
      break;
    case 'identical':
      if (input.action === 'split') entry.stock = 1;
      else if (input.action !== 'confirmIdentical')
        throw new Error('invalid_action');
      state.stage =
        entry.condition === 'used' && /iphone/i.test(`${document.shared.model}`)
          ? 'battery'
          : 'notes';
      break;
    case 'battery':
      if (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > 100)
        throw new Error('invalid_battery');
      entry.batteryHealth = Number(value);
      state.stage = 'notes';
      break;
    case 'notes':
      entry.conditionNote = value === '-' ? '' : value;
      state.stage = 'accessories';
      break;
    case 'accessories':
      entry.accessories = value === '-' ? '' : value;
      if (entry.experience)
        entry.experience.packageContents =
          value === '-'
            ? []
            : value
                .split(/[,;\n]/)
                .map((label) => ({
                  label: {
                    de: label.trim().slice(0, 120),
                    en: label.trim().slice(0, 120),
                  },
                  included: true,
                }))
                .filter((item) => item.label.de)
                .slice(0, 30);
      state.stage = 'versions';
      break;
    case 'presentation':
      if (input.action === 'next') {
        state.stage = 'photos';
        document.step = 3;
      } else if (text) {
        document.shared.description = text;
        document.shared.aiGeneratedFields = (
          document.shared.aiGeneratedFields ?? []
        ).filter((f) => f !== 'description');
      } else throw new Error('invalid_action');
      break;
    case 'photos':
      if (input.action === 'next') {
        state.stage = 'information';
        document.step = 4;
      } else if (
        input.action.startsWith('photoKind:') &&
        [
          'device',
          'box',
          'barcode_label',
          'about_screen',
          'battery_health',
        ].includes(input.action.slice(10))
      )
        state.photoKind = input.action.slice(10) as Conversation['photoKind'];
      else if (
        input.action.startsWith('photoEntry:') &&
        document.entries.some((e) => e.id === input.action.slice(11))
      )
        state.entryId = input.action.slice(11);
      else if (
        input.action.startsWith('cover:') &&
        entry.photos.some((p) => p.id === input.action.slice(6) && p.url)
      )
        entry.coverId = input.action.slice(6);
      else throw new Error('invalid_action');
      break;
    case 'information':
      if (input.action === 'next') {
        state.entryId = document.entries[0].id;
        state.stage = 'gtin';
      } else if (text)
        document.shared.specs = [
          ...(document.shared.specs ?? []),
          ...text.split('\n').map((line) => {
            const i = line.indexOf(':');
            if (i < 1) throw new Error('configuration_format');
            return {
              label: line.slice(0, i).trim(),
              value: line.slice(i + 1).trim(),
            };
          }),
        ].slice(0, 60);
      else throw new Error('invalid_action');
      break;
    case 'gtin':
      if (value !== '-') {
        const gtin = validatedGtin(value);
        if (!gtin) throw new Error('invalid_gtin');
        entry.details.gtin = gtin;
        entry.details.identifierStatus = 'assigned';
      }
      state.stage = 'mpn';
      break;
    case 'mpn': {
      if (value !== '-') entry.details.mpn = value.slice(0, 120);
      const index = document.entries.findIndex((e) => e.id === entry.id);
      if (index < document.entries.length - 1) {
        state.entryId = document.entries[index + 1].id;
        state.stage = 'gtin';
      } else {
        state.stage = 'channels';
        document.step = 5;
      }
      break;
    }
    case 'channels':
      if (input.action !== 'next') throw new Error('invalid_action');
      state.stage = 'review';
      document.step = 6;
      break;
    case 'review':
      if (input.action !== 'submit') throw new Error('invalid_action');
      return { state, document, submit: true };
  }
  return { state, document };
};

export const renderConversation = (
  state: Conversation,
  doc: PhoneDocument,
  revision: number,
  status = 'collecting',
): BotView => {
  const l = state.locale,
    t = (de: string, en: string) => tr(l, de, en),
    entry = currentEntry(doc, state);
  const b = (text: string, action: string): Button => ({ text, action });
  const next = [b(t('Weiter →', 'Next →'), 'next')];
  let text = '',
    buttons: Button[][] = [];
  if (!['collecting', 'changes_requested'].includes(status))
    return {
      revision,
      text: t(
        `Status: ${status}. Weiter im Admin prüfen.`,
        `Status: ${status}. Continue review in admin.`,
      ),
      buttons: [
        [b(t('Weiteres Produkt', 'Add another product'), 'new')],
        [b(t('Meine Entwürfe', 'My drafts'), 'list')],
      ],
    };
  switch (state.stage) {
    case 'category':
      text = t(
        '1/7 · Welche Produktkategorie?',
        '1/7 · Which product category?',
      );
      buttons = categories.map((c) => [
        b(
          {
            smartphones: t('Smartphones', 'Smartphones'),
            tablets: t('Tablets', 'Tablets'),
            laptops: t('Laptops', 'Laptops'),
            consoles: t('Konsolen', 'Consoles'),
            accessories: t('Zubehör', 'Accessories'),
            parts: t('Ersatzteile', 'Parts'),
          }[c],
          `choose:${c}`,
        ),
      ]);
      break;
    case 'brand':
      text = t(
        '1/7 · Marke wählen oder eingeben.',
        '1/7 · Choose or type the brand.',
      );
      buttons = [
        'Apple',
        'Samsung',
        'Google',
        'Lenovo',
        'Sony',
        'Nintendo',
      ].map((v) => [b(v, `choose:${v}`)]);
      break;
    case 'model':
      text = t(
        '1/7 · Modell eingeben, z. B. iPhone 17 Pro.',
        '1/7 · Type the model, e.g. iPhone 17 Pro.',
      );
      break;
    case 'condition':
      text = t(
        '1/7 · Zustand dieser Geräte?',
        '1/7 · What is their condition?',
      );
      buttons = [
        [
          b(t('Neu / versiegelt', 'New / sealed'), 'choose:new'),
          b('Open-box', 'choose:open_box'),
          b(t('Gebraucht', 'Used'), 'choose:used'),
        ],
      ];
      break;
    case 'researching':
      text = state.researchError
        ? t(
            `Recherche pausiert (${state.researchError}). Eingaben bleiben gespeichert.`,
            `Research paused (${state.researchError}). Your entries are saved.`,
          )
        : t(
            'Offizielle Modellinformationen werden recherchiert…',
            'Researching official model information…',
          );
      buttons = [
        [
          b(t('Erneut versuchen', 'Retry'), 'retry'),
          b(t('Manuell weiter', 'Continue manually'), 'manual'),
        ],
      ];
      break;
    case 'versions': {
      text = t(
        '2/7 · Welche Versionen stehen im Laden? Jede Auswahl danach mit Preis und Menge ergänzen.',
        '2/7 · Which versions are in the shop? Complete price and quantity for each selection.',
      );
      const suggestions = doc.variantSuggestions ?? [],
        start = state.page * 8;
      buttons = suggestions
        .slice(start, start + 8)
        .map((o, i) => [
          b(
            [o.color, o.storage, ...Object.values(o.configuration ?? {})]
              .filter(Boolean)
              .join(' · '),
            `variant:${start + i}`,
          ),
        ]);
      if (state.page > 0) buttons.push([b('←', `page:${state.page - 1}`)]);
      if (start + 8 < Math.max(suggestions.length, doc.entries.length))
        buttons.push([b('→', `page:${state.page + 1}`)]);
      buttons.push([
        b(t('Version manuell hinzufügen', 'Add version manually'), 'add'),
      ]);
      for (const e of doc.entries.slice(start, start + 8))
        buttons.push([
          b(`✎ ${versionLabel(e)} · €${e.price} × ${e.stock}`, `entry:${e.id}`),
        ]);
      buttons.push(next);
      break;
    }
    case 'color':
      text = t(
        '2/7 · Farbe? „-“ falls nicht anwendbar.',
        '2/7 · Color? Type “-” if not applicable.',
      );
      break;
    case 'storage':
      text = t(
        '2/7 · Speicher, z. B. 256 GB? „-“ falls nicht anwendbar.',
        '2/7 · Storage, e.g. 256 GB? Type “-” if not applicable.',
      );
      break;
    case 'configuration':
      text = t(
        'Weitere Version: je Zeile Merkmal: Wert (z. B. RAM: 16 GB). „-“ zum Überspringen.',
        'Other configuration: one Attribute: Value per line (e.g. RAM: 16 GB). Type “-” to skip.',
      );
      break;
    case 'price':
      text = `${versionLabel(entry)}\n${t('2/7 · Verkaufspreis in €? Zum Beispiel 699,90.', '2/7 · Selling price in €? For example 699.90.')}`;
      break;
    case 'stock':
      text = t(
        '2/7 · Tatsächliche Gesamtmenge dieser Version?',
        '2/7 · Actual total quantity of this version?',
      );
      buttons = [[1, 2, 3, 5, 10].map((n) => b(String(n), `choose:${n}`))];
      break;
    case 'identical':
      text = t(
        'Nur identische Geräte zusammenfassen: Farbe, Speicher, Zustand und Batteriekapazität müssen übereinstimmen. Die Fotos müssen alle Geräte wahrheitsgetreu zeigen. Sonst einzelne Versionen anlegen.',
        'Group only identical devices: color, storage, condition and battery health must match. Photos must truthfully represent every device. Otherwise add separate versions.',
      );
      buttons = [
        [
          b(
            t('Identisch bestätigt', 'Confirmed identical'),
            'confirmIdentical',
          ),
        ],
        [b(t('Einzelgerät anlegen', 'Use one device'), 'split')],
      ];
      break;
    case 'battery':
      text = t(
        '2/7 · Tatsächliche Batteriekapazität in % (1–100)?',
        '2/7 · Actual battery health in % (1–100)?',
      );
      break;
    case 'notes':
      text = t(
        '2/7 · Zustand / sichtbare Schäden? „-“ wenn keine Angaben.',
        '2/7 · Condition / visible defects? Type “-” if none recorded.',
      );
      break;
    case 'accessories':
      text = t(
        '2/7 · Tatsächlich enthaltenes Zubehör? „-“ wenn keines.',
        '2/7 · Actual included accessories? Type “-” if none.',
      );
      break;
    case 'presentation':
      text = `3/7 · ${doc.shared.title}\n\n${doc.shared.description ?? t('Beschreibung fehlt.', 'Description missing.')}\n\n${t('Beschreibung bei Bedarf eingeben oder weiter.', 'Type a replacement description if needed, or continue.')}`;
      buttons = [next];
      break;
    case 'photos':
      text = t(
        `4/7 · Fotos für ${versionLabel(entry)}. Typ: ${{ device: 'Gerät', box: 'Karton', barcode_label: 'Barcode', about_screen: 'Geräteinformationen', battery_health: 'Akku' }[state.photoKind]}. Kamera/Galerie oder Bilddatei senden. Gerät und Schäden müssen wahrheitsgetreu erkennbar bleiben.`,
        `4/7 · Photos for ${versionLabel(entry)}. Type: ${{ device: 'Device', box: 'Box', barcode_label: 'Barcode', about_screen: 'About screen', battery_health: 'Battery' }[state.photoKind]}. Send camera/gallery photos or an image file. Preserve the real device and any visible wear.`,
      );
      buttons = doc.entries
        .slice(state.page * 8, state.page * 8 + 8)
        .map((e) => [b(versionLabel(e) || e.sku, `photoEntry:${e.id}`)]);
      if (state.page > 0) buttons.push([b('←', `page:${state.page - 1}`)]);
      if (state.page * 8 + 8 < doc.entries.length)
        buttons.push([b('→', `page:${state.page + 1}`)]);
      buttons.push(
        [
          b(t('Gerätefoto', 'Device photo'), 'photoKind:device'),
          b(t('Karton', 'Box'), 'photoKind:box'),
        ],
        [
          b('EAN', 'photoKind:barcode_label'),
          b('About', 'photoKind:about_screen'),
          b(t('Akku', 'Battery'), 'photoKind:battery_health'),
        ],
        ...entry.photos
          .filter((p) => p.url)
          .map((p, i) => [
            b(
              `${t('Titelbild', 'Cover')} ${i + 1}${p.id === entry.coverId ? ' ✓' : ''}`,
              `cover:${p.id}`,
            ),
          ]),
        next,
      );
      break;
    case 'information':
      text = `5/7 · ${t('Produktinformationen', 'Product information')}\n${(
        doc.shared.specs ?? []
      )
        .map((s) => `${s.label}: ${s.value}`)
        .join('\n')
        .slice(
          0,
          1800,
        )}\n\n${t('Weitere Angaben als Merkmal: Wert eingeben oder weiter.', 'Type additional Attribute: Value lines or continue.')}\n${state.warnings.join('\n').slice(0, 500)}\n${state.sources
        .map((s) => s.url)
        .join('\n')
        .slice(0, 700)}`;
      buttons = [next];
      break;
    case 'gtin':
      text = `${versionLabel(entry)}\n${t('5/7 · EAN/GTIN dieser Version? „-“ wenn unbekannt. Nie IMEI oder Seriennummer senden.', '5/7 · EAN/GTIN for this version? Type “-” if unknown. Never send IMEI or serial numbers.')}`;
      break;
    case 'mpn':
      text = `${versionLabel(entry)}\n${t('5/7 · Hersteller-Teilenummer (MPN)? „-“ wenn unbekannt.', '5/7 · Manufacturer part number (MPN)? Type “-” if unknown.')}`;
      break;
    case 'channels': {
      const names = {
        store: t('Website', 'Website'),
        google: 'Google Merchant',
        ebay: 'eBay',
        amazon: 'Amazon',
      };
      const readiness = entryReadiness(doc, entry);
      text = `6/7 · ${versionLabel(entry)}\n${t('Verkaufskanäle auswählen. Verbindungen werden im Admin verwaltet.', 'Select selling channels. Connections are managed in admin.')}\n${channels.map((c) => `${names[c]}: ${readiness[c].ready ? t('Angaben vollständig', 'Information complete') : readiness[c].errors.slice(0, 2).join(' ')}`).join('\n')}`;
      buttons = doc.entries
        .slice(state.page * 8, state.page * 8 + 8)
        .map((e) => [b(versionLabel(e) || e.sku, `channelEntry:${e.id}`)]);
      if (state.page > 0) buttons.push([b('←', `page:${state.page - 1}`)]);
      if (state.page * 8 + 8 < doc.entries.length)
        buttons.push([b('→', `page:${state.page + 1}`)]);
      buttons.push(
        ...channels.map((c) => [
          b(
            `${entry.channels.includes(c) ? '✓ ' : ''}${names[c]}`,
            `channel:${c}`,
          ),
        ]),
        next,
      );
      break;
    }
    case 'review':
      text = `7/7 · ${doc.shared.title}\n${doc.entries.map((e) => `${versionLabel(e)} · €${e.price.toFixed(2)} × ${e.stock} · ${e.photos.filter((p) => p.url).length} ${t('Fotos', 'photos')}`).join('\n')}\n\n${telegramBlockers(doc, l).slice(0, 10).join('\n') || t('Bereit für die Inhaberprüfung.', 'Ready for owner review.')}\n\n${t('Absenden veröffentlicht nichts. Fehlende Angaben können im Admin ergänzt werden.', 'Submitting does not publish anything. Missing information can be completed in admin.')}`;
      buttons = [
        [b(t('Zur Prüfung senden', 'Submit for review'), 'submit')],
        ...jumpStages
          .slice(0, 6)
          .map((s, i) => [
            b(`${t('Schritt bearbeiten', 'Edit step')} ${i + 1}`, `edit:${s}`),
          ]),
      ];
      break;
  }
  if (['color', 'price'].includes(state.stage) && !state.updateOnly)
    buttons.unshift([
      b(t('Neu', 'New'), 'setCondition:new'),
      b('Open-box', 'setCondition:open_box'),
      b(t('Gebraucht', 'Used'), 'setCondition:used'),
    ]);
  if (state.stage === 'configuration') {
    text = `${versionLabel(entry)}\n${text}`;
    buttons.unshift([
      b(t('Angaben behalten / weiter', 'Keep details / continue'), 'choose:-'),
    ]);
  }
  if (['notes', 'accessories', 'gtin', 'mpn'].includes(state.stage))
    buttons.unshift([b(t('Keine / unbekannt', 'None / unknown'), 'choose:-')]);
  if (
    ['color', 'storage'].includes(state.stage) &&
    ['parts', 'accessories'].includes(doc.shared.category ?? '')
  )
    buttons.unshift([b(t('Nicht anwendbar', 'Not applicable'), 'choose:-')]);
  buttons.push(
    [
      b(t('← Zurück', '← Back'), 'back'),
      b(t('Speichern & beenden', 'Save & exit'), 'save'),
    ],
    [b(t('Abbrechen', 'Cancel'), 'cancel')],
  );
  return {
    text,
    buttons,
    revision,
    pending: state.stage === 'researching' && !state.researchError,
  };
};
export const newPhotoSlot = (url: string): { id: string; url: string } => ({
  id: randomUUID(),
  url,
});
