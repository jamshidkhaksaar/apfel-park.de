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
import { phoneEditorText } from '@/lib/smartphone-editor/i18n';
import { validatedGtin } from '@/lib/product-identifiers';
import { findSensitiveDataIssues } from '@/lib/product-intake/redaction';
import { telegramAccessoryChoices, setTelegramAccessories } from './offer-content';
import { defaultOfferPresets, type OfferPresets } from '@/lib/product-offer-options';

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
  | 'edit_menu'
  | 'basics'
  | 'entry_edit'
  | 'defects'
  | 'accessory_custom'
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
  guided?: boolean;
  existingMode?: boolean;
  conditionChosen?: boolean;
  editing?: boolean;
  singleField?: boolean;
  selectedAccessories?: string[];
  photoAngles?: Record<string, string[]>;
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
  locale?: Locale;
  gallery?: Array<{ id: string; edited: boolean; caption: string }>;
  text: string;
  buttons: Button[][];
  revision: number;
  sessionId?: string;
  pending?: boolean;
  photos?: Array<{ id: string; label: string; edited: boolean }>;
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
      guided: true,
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
export const photoGuide = (doc: PhoneDocument): Array<{key: string; de: string; en: string}> => {
  if (doc.shared.category === 'parts') return [
    {key:'front',de:'Vorderseite',en:'Front'}, {key:'back',de:'Rückseite',en:'Back'}, {key:'connector',de:'Anschlüsse / Details',en:'Connectors / details'},
  ];
  if (doc.shared.category === 'accessories') return [
    {key:'front',de:'Vorderseite',en:'Front'}, {key:'back',de:'Rückseite',en:'Back'}, {key:'side',de:'Seitenansicht',en:'Side'}, {key:'details',de:'Details / Lieferumfang',en:'Details / included items'},
  ];
  return [
    {key:'front',de:doc.shared.category==='laptops'?'Geöffnetes Gerät / Bildschirm':'Vorderseite / Bildschirm',en:doc.shared.category==='laptops'?'Open device / screen':'Front / screen'},
    {key:'back',de:'Rückseite',en:'Back'}, {key:'left',de:'Linke Seite',en:'Left side'}, {key:'right',de:'Rechte Seite',en:'Right side'}, {key:'top',de:'Oberseite',en:'Top'}, {key:'bottom',de:'Unterseite',en:'Bottom'},
  ];
};
export const accessoryOptions = (doc: PhoneDocument) => {
  const options = telegramAccessoryChoices;
  const keys = doc.shared.category==='consoles' ? ['box','controller','hdmi','charger'] : doc.shared.category==='laptops' ? ['box','charger','bag','usb_c'] : ['smartphones','tablets'].includes(doc.shared.category??'') ? ['box','usb_c','lightning','charger','case','protector'] : ['box','usb_c','charger'];
  return options.filter(option=>keys.includes(option.key));
};
const needsBattery = (doc: PhoneDocument) => doc.shared.category==='smartphones' && /iphone/i.test(doc.shared.model??'');
const review = (state: Conversation, document: PhoneDocument) => {state.stage='review';document.step=6;state.editing=false;state.singleField=false;};
const startPhotos = (state: Conversation, document: PhoneDocument) => {state.stage='photos';document.step=3;state.photoKind='device';state.photoAngles??={};};

const jumpStages: Stage[] = [
  'basics',
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
  presets: OfferPresets = defaultOfferPresets(),
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
    ['color', 'price'].includes(state.stage) && !state.guided
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
    if (!jumpStages.includes(stage) || (state.updateOnly && stage!=='versions')) throw new Error('invalid_action');
    state.stage = stage;
    state.editing = Boolean(state.guided);
    state.page = 0;
    document.step = jumpStages.indexOf(stage);
    return { state, document };
  }
  if (state.guided && input.action === 'editMenu') {state.stage=state.updateOnly?'entry_edit':'edit_menu';return {state,document};}
  if (state.guided && input.action === 'preview') {review(state,document);return {state,document};}
  if (state.guided && input.action === 'addVersion' && state.stage==='review') {state.stage='versions';state.editing=false;state.page=0;return {state,document};}
  if (state.guided && input.action.startsWith('basic:') && state.stage==='basics') {
    const stage=input.action.slice(6) as Stage;
    if(!['category','brand','model','condition'].includes(stage))throw new Error('invalid_action');
    state.stage=stage;state.editing=true;return {state,document};
  }
  if(state.guided && input.action.startsWith('field:') && state.stage==='entry_edit'){
    const stage=input.action.slice(6) as Stage;
    if((state.updateOnly && !['stock','price'].includes(stage)) || !['color','stock','price','battery','notes','accessories'].includes(stage) || (stage==='battery'&&!needsBattery(document)))throw new Error('invalid_action');
    state.stage=stage;state.singleField=true;state.selectedAccessories=stage==='accessories'?entry.accessories.split(', ').filter(Boolean).map(label=>accessoryOptions(document).find(option=>option.de===label||option.en===label)?.key??'custom:'+label):[];return {state,document};
  }
  if (input.action === 'back') {
    if(state.guided && state.editing){state.stage='edit_menu';return {state,document};}
    if(state.guided){
      const previous: Partial<Record<Stage,Stage>>={price:'stock',stock:'versions',battery:'price',notes:needsBattery(document)?'battery':'price',defects:'notes',accessories:'notes',accessory_custom:'accessories',photos:'accessories',review:'edit_menu'};
      if(previous[state.stage]){state.stage=previous[state.stage]!;return {state,document};}
    }
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
    state.stage = state.guided ? 'entry_edit' : 'color';
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
      if(state.guided && state.conditionChosen){state.stage='researching';delete state.researchError;return {state,document,research:true};}
      state.stage = 'condition';
      break;
    case 'condition':
      if (!['new', 'open_box', 'used'].includes(value))
        throw new Error('invalid_action');
      state.condition = value as Conversation['condition'];
      entry.condition = state.condition;
      state.conditionChosen=true;
      if(entry.condition!=='new' && entry.experience)entry.experience.packageContents=[];
      if(state.guided && state.editing){review(state,document);break;}
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
        if(state.guided){review(state,document);break;}
        state.stage = 'presentation';
        document.step = 2;
        break;
      }
      if (document.entries.length >= 100) throw new Error('too_many_entries');
      const untouched = state.guided ? entry.price===0 && !entry.photos.some(p=>p.url) :
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
      state.selectedAccessories=[];state.singleField=false;state.editing=false;
      state.stage = target.color && (target.storage || !['smartphones','tablets','laptops'].includes(document.shared.category??'')) ? (state.guided ? 'stock' : 'price') : 'color';
      document.step = 1;
      break;
    }
    case 'color':
      entry.color = value === '-' ? '' : value.slice(0, 80);
      state.stage = 'storage';
      break;
    case 'storage':
      entry.storage = value === '-' ? '' : value.slice(0, 80);
      state.stage = state.guided && ['smartphones','consoles'].includes(document.shared.category??'') ? (state.singleField?'review':'stock') : 'configuration';
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
      state.stage = state.guided ? (state.singleField?'review':'stock') : 'price';
      break;
    case 'price': {
      if (!/^\d{1,7}(?:[.,]\d{1,2})?$/.test(value.replace(/\s*€$/, '')))
        throw new Error('invalid_price');
      const price = Number(value.replace(/\s*€$/, '').replace(',', '.'));
      if (!(price > 0)) throw new Error('invalid_price');
      entry.price = price;
      state.stage = state.guided && state.singleField ? 'review' : state.guided && !state.updateOnly ? (needsBattery(document)?'battery':'notes') : 'stock';
      break;
    }
    case 'stock':
      if (!/^\d{1,6}$/.test(value)) throw new Error('invalid_quantity');
      entry.stock = Number(value);
      if(state.guided && !state.updateOnly){state.stage=entry.condition!=='new' && entry.stock>1 ? 'identical' : state.singleField?'review':'price';break;}
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
      if(state.guided){state.stage=state.singleField?'review':'price';break;}
      state.stage =
        entry.condition === 'used' && /iphone/i.test(`${document.shared.model}`)
          ? 'battery'
          : 'notes';
      break;
    case 'battery':
      if(state.guided && input.action==='batteryUnknown'){entry.batteryHealth=null;state.stage=state.singleField?'review':'notes';break;}
      if (!/^\d{1,3}$/.test(value) || Number(value) < 1 || Number(value) > 100)
        throw new Error('invalid_battery');
      entry.batteryHealth = Number(value);
      state.stage = state.guided && state.singleField ? 'review' : 'notes';
      break;
    case 'notes':
      if(state.guided){
        if(input.action==='defectType'){state.stage='defects';break;}
        if(input.action!=='defectNone' && input.action!=='choose:-' && !text)throw new Error('invalid_action');
        entry.defects=text || 'Keine sichtbaren Mängel gemeldet.';
        entry.conditionNote=entry.defects;
        state.stage=state.singleField?'review':'accessories';break;
      }
      entry.conditionNote = value === '-' ? '' : value;
      state.stage = 'accessories';
      break;
    case 'defects':
      if(!text)throw new Error('invalid_input');entry.defects=text;entry.conditionNote=text;state.stage=state.singleField?'review':'accessories';break;
    case 'accessory_custom':
      if(!text || text.length>120)throw new Error('invalid_input');state.selectedAccessories=[...(state.selectedAccessories??[]).filter(key=>key!=='custom:'+text),'custom:'+text].slice(0,20);state.stage='accessories';setTelegramAccessories(entry,state.selectedAccessories??[],presets);break;
    case 'accessories':
      if(state.guided){
        if(input.action==='accessoryOther'){state.stage='accessory_custom';break;}
        if(input.action.startsWith('accessory:')){
          const key=input.action.slice(10);if(!accessoryOptions(document).some(option=>option.key===key))throw new Error('invalid_action');
          const chosen=state.selectedAccessories??[];state.selectedAccessories=chosen.includes(key)?chosen.filter(v=>v!==key):[...chosen,key];setTelegramAccessories(entry,state.selectedAccessories??[],presets);break;
        }
        if(input.action==='accessoryNone' || input.action==='choose:-')state.selectedAccessories=[];
        else if(input.action!=='accessoryDone')throw new Error('invalid_action');
        if(input.action==='accessoryDone' && !state.selectedAccessories?.length)throw new Error('select_accessories_or_none');
        setTelegramAccessories(entry,state.selectedAccessories??[],presets);
        if(state.singleField)review(state,document);else startPhotos(state,document);break;
      }
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
        if(state.guided && state.editing){review(state,document);break;}
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
      if(state.guided && input.action==='photoRetake'){entry.photos=newPhoneEntry().photos;entry.coverId=entry.photos[0].id;entry.hasRealProductPhotos=false;state.photoAngles={...state.photoAngles,[entry.id]:[]};break;}
      if(state.guided && input.action==='photoUnavailable'){
        if(!state.warnings.includes('Device photos incomplete'))state.warnings.push('Device photos incomplete');
        review(state,document);break;
      }
      if (input.action === 'next') {
        if(state.guided){review(state,document);break;}
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
      if(state.guided && input.action==='identifiers'){state.stage='gtin';break;}
      if (input.action === 'next') {
        if(state.guided){review(state,document);break;}
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
        if(state.guided){review(state,document);break;}
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
    case 'basics':
    case 'entry_edit':
    case 'edit_menu':
      throw new Error('invalid_action');
    case 'review':
      if (input.action !== 'submit') throw new Error('invalid_action');
      return { state, document, submit: true };
  }
  if(state.guided && state.stage==='review')document.step=6;
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
          b(t('Open-Box', 'Open box'), 'choose:open_box'),
          b(t('Gebraucht', 'Used'), 'choose:used'),
        ],
      ];
      break;
    case 'researching':
      text = state.researchError
        ? t(
            state.researchError === 'gemini_credits_depleted'
              ? 'Gemini-Guthaben aufgebraucht. Der Inhaber muss Guthaben aufladen oder unter Einstellungen → KI-Anbieter einen Schlüssel mit Guthaben aktivieren. Danach erneut versuchen oder manuell fortfahren. Eingaben bleiben gespeichert.'
              : `Recherche pausiert (${state.researchError}). Eingaben bleiben gespeichert.`,
            state.researchError === 'gemini_credits_depleted'
              ? 'Gemini credits are depleted. Ask the owner to top up billing or activate a funded key in Settings → AI Providers. Then retry, or continue manually. Your entries are saved.'
              : `Research paused (${state.researchError}). Your entries are saved.`,
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
      {
        const pager: Button[] = [];
        if (state.page > 0) pager.push(b('←', `page:${state.page - 1}`));
        if (start + 8 < Math.max(suggestions.length, doc.entries.length))
          pager.push(b('→', `page:${state.page + 1}`));
        if (pager.length) buttons.push(pager);
      }
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
      {
        const pager: Button[] = [];
        if (state.page > 0) pager.push(b('←', `page:${state.page - 1}`));
        if (state.page * 8 + 8 < doc.entries.length)
          pager.push(b('→', `page:${state.page + 1}`));
        if (pager.length) buttons.push(pager);
      }
      buttons.push(
        [
          b(t('Gerätefoto', 'Device photo'), 'photoKind:device'),
          b(t('Karton', 'Box'), 'photoKind:box'),
        ],
        [
          b(t('Barcode (EAN)', 'Barcode (EAN)'), 'photoKind:barcode_label'),
          b(t('Geräteinfos', 'About screen'), 'photoKind:about_screen'),
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
      {
        const pager: Button[] = [];
        if (state.page > 0) pager.push(b('←', `page:${state.page - 1}`));
        if (state.page * 8 + 8 < doc.entries.length)
          pager.push(b('→', `page:${state.page + 1}`));
        if (pager.length) buttons.push(pager);
      }
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
  if(state.guided){
    const steps=phoneEditorText[l].steps;
    switch(state.stage){
      case 'edit_menu':
        text=t('✏️ Was möchtest du korrigieren?','✏️ What would you like to correct?');
        buttons=jumpStages.map((stage,i)=>[b(`${i+1}. ${steps[i]}`,`edit:${stage}`)]);
        buttons.push([b(t('Zur Vorschau','Back to preview'),'preview')]);break;
      case 'basics':
        text=`1/7 · ${steps[0]}\n${doc.shared.brand} ${doc.shared.model}\n${t('Nur das gewählte Feld wird geändert.','Choose the detail to change.')}`;
        buttons=[[b(t('Kategorie','Category'),'basic:category'),b(t('Marke','Brand'),'basic:brand')],[b(t('Modell','Model'),'basic:model'),b(t('Zustand','Condition'),'basic:condition')],[b(t('Zur Vorschau','Back to preview'),'preview')]];break;
      case 'entry_edit':
        text=`2/7 · ${versionLabel(entry)}\n${t('Welche Angabe ändern?','Which detail should change?')}`;
        buttons=[[b(t('Menge','Quantity'),'field:stock'),b(t('Preis','Price'),'field:price')],[b(t('Farbe / Speicher','Color / storage'),'field:color'),b(t('Schäden','Defects'),'field:notes')],[b(t('Zubehör','Accessories'),'field:accessories')]];
        if(state.updateOnly)buttons=buttons.slice(0,1);
        if(needsBattery(doc) && !state.updateOnly)buttons.push([b(t('Batteriekapazität','Battery health'),'field:battery')]);
        buttons.push([b(t('Zur Vorschau','Back to preview'),'preview')]);break;
      case 'researching':
        if(!state.researchError){text=`⏳ ${doc.shared.brand} ${doc.shared.model}\n\n${t('Offizielle Quellen werden geprüft und Modellversionen vorbereitet. Du musst nichts eingeben. Das Ergebnis erscheint automatisch.','Checking official sources and preparing model versions. No input needed; the result will appear automatically.')}`;buttons=[];}
        break;
      case 'versions': {
        if(state.existingMode){text=t('Bestandsmodus: Ein gespeichertes Angebot auswählen. Nur Preis und Gesamtmenge werden geändert. Für ein neues Produkt /cancel und /new verwenden.','Stock-update mode: choose a saved offer below. Only price and total quantity change. For a new product, use /cancel then /new.');buttons=[];break;}
        text=state.editing ? `2/7 · ${steps[1]}\n${t('Gespeicherte Version zum Bearbeiten wählen.','Choose a saved version to edit.')}` : `✅ ${doc.shared.brand} ${doc.shared.model}\n${t('Welche genaue Version hast du im Laden? Danach folgen Menge, Preis und Fotos.','Which exact version is in the shop? Next: quantity, price and photos.')}`;
        buttons=state.editing ? doc.entries.slice(state.page*8,state.page*8+8).map(e=>[b(versionLabel(e),`entry:${e.id}`)]) : (doc.variantSuggestions??[]).slice(state.page*8,state.page*8+8).map((o,i)=>[b([o.color,o.storage,...Object.values(o.configuration??{})].filter(Boolean).join(' · '),`variant:${state.page*8+i}`)]);
        const count=state.editing?doc.entries.length:(doc.variantSuggestions??[]).length;
        const pager:Button[]=[];if(state.page>0)pager.push(b('←',`page:${state.page-1}`));if((state.page+1)*8<count)pager.push(b('→',`page:${state.page+1}`));if(pager.length)buttons.push(pager);
        buttons.push([b(t('Version manuell eingeben','Enter version manually'),'add')]);
        if(state.editing)buttons.push([b(t('Zur Vorschau','Back to preview'),'preview')]);break;
      }
      case 'battery':buttons=[[b(t('Nicht zugänglich – später ergänzen','Not accessible – complete later'),'batteryUnknown')]];break;
      case 'notes':
        text=`2/7 · ${t('Sind sichtbare Schäden oder Mängel vorhanden?','Are there any visible defects or damage?')}`;
        buttons=[[b(t('Keine sichtbaren Schäden','No visible defects'),'defectNone')],[b(t('Schaden beschreiben','Describe a defect'),'defectType')]];break;
      case 'defects':text=t('Beschreibe den sichtbaren Schaden kurz, z. B. Kratzer am Rahmen.','Briefly describe the visible defect, e.g. scratches on the frame.');buttons=[];break;
      case 'accessory_custom':text=t('Welches weitere Zubehör ist tatsächlich dabei?','What other accessory is actually included?');buttons=[];break;
      case 'accessories': {
        const options=accessoryOptions(doc),chosen=state.selectedAccessories??[];
        text=`2/7 · ${t('Tatsächlich enthaltenes Zubehör auswählen. Mehrfachauswahl möglich.','Select the accessories actually included. You can choose several.')}\n${entry.accessories || t('Noch nichts ausgewählt.','Nothing selected yet.')}`;
        buttons=[];for(let i=0;i<options.length;i+=2)buttons.push(options.slice(i,i+2).map(option=>b(`${chosen.includes(option.key)?'✓ ':''}${option[l]}`,`accessory:${option.key}`)));
        buttons.push([b(t('Kein Zubehör','No accessories'),'accessoryNone'),b(t('Sonstiges…','Other…'),'accessoryOther')]);
        if(chosen.length)buttons.push([b(state.singleField?t('Zubehör speichern','Save accessories'):t('Zubehör bestätigen → Fotos','Confirm accessories → photos'),'accessoryDone')]);break;
      }
      case 'photos': {
        const guide=photoGuide(doc),done=state.photoAngles?.[entry.id]??[],angle=guide.find(item=>!done.includes(item.key));
        text=state.photoKind==='box' ? t('📦 Kartonfoto senden. Ein Kartonfoto ersetzt kein echtes Gerätefoto.','📦 Send a box photo. A box photo does not replace actual device photos.') : angle ? `📷 4/7 · ${steps[3]} · ${done.length+1}/${guide.length}\n${angle[l]}\n\n${t('Jetzt ein Foto dieser Seite senden. Danach Vorschau prüfen; anschließend folgt die nächste Seite. Schäden müssen erkennbar bleiben. Keine IMEI oder Seriennummern zeigen.','Send one photo of this side now. Review its preview, then continue to the next side. Keep defects visible. Do not show IMEI or serial numbers.')}` : t('✅ Alle angeforderten Ansichten sind bestätigt.','✅ All requested views are approved.');
        buttons=angle?[[b(t('Nur Karton zugänglich','Only the box is accessible'),'photoKind:box')],[b(t('Mit fehlenden Fotos zur Vorschau','Preview with missing device photos'),'photoUnavailable')]]:[[b(t('Vorschau öffnen','Open preview'),'preview')]];
        if(state.photoKind==='box')buttons.unshift([b(t('Zurück zu Gerätefotos','Back to device photos'),'photoKind:device')]);
        if(state.editing)buttons.push([b(t('Alle Gerätefotos neu aufnehmen','Retake all device photos'),'photoRetake')]);
        break;
      }
      case 'information':buttons=[[b(t('Kennungen ergänzen (optional)','Add identifiers (optional)'),'identifiers')],[b(t('Zur Vorschau','Back to preview'),'preview')]];break;
      case 'review': {
        const names={store:t('Website','Website'),google:'Google Merchant',ebay:'eBay',amazon:'Amazon'};
        const conditionName=(value:string)=>value==='new'?t('Neu / versiegelt','New / sealed'):value==='open_box'?t('Open-Box','Open box'):t('Gebraucht','Used');
        const versions=doc.entries.slice(0,6).map((e,i)=>`${i+1}. ${[e.color,e.storage,...Object.values(e.configuration??{})].filter(Boolean).join(' · ').slice(0,160)}\n${t('Menge','Qty')}: ${e.stock} · €${e.price.toFixed(2)} · ${conditionName(e.condition)}${e.batteryHealth!=null?` · ${t('Akku','Battery')}: ${e.batteryHealth}%`:''}\n${t('Schäden','Defects')}: ${(e.defects||e.conditionNote||t('Nicht erfasst','Not recorded')).slice(0,100)}\n${t('Zubehör','Accessories')}: ${(e.accessories||t('Keines','None')).slice(0,120)}`).join('\n\n');
        const blockers=telegramBlockers(doc,l);
        text=[`✅ ${doc.shared.title}\n${t('Entwurfsvorschau – noch nicht veröffentlicht','Draft preview – not published')}`,`1/7 · ${steps[0]}\n${doc.shared.brand} ${doc.shared.model} · ${doc.shared.category}`,`2/7 · ${steps[1]}\n${versions.slice(0,1500)}${doc.entries.length>6?`\n+${doc.entries.length-6} ${t('weitere Versionen','more versions')}`:''}`,`3/7 · ${steps[2]}\n${(doc.shared.description||t('Noch keine Beschreibung. Im Admin ergänzen.','No description yet. Complete it in admin.')).slice(0,450)}`,`4/7 · ${steps[3]}\n${doc.entries.map(e=>`${e.color} ${e.storage}: ${e.photos.filter(p=>p.url).length} ${t('bestätigte Fotos','approved photos')}`).join('\n').slice(0,350)}`,`5/7 · ${steps[4]}\n${(doc.shared.specs??[]).slice(0,4).map(spec=>`${spec.label}: ${spec.value}`).join('\n').slice(0,350)||t('Noch unvollständig.','Still incomplete.')}`,`6/7 · ${steps[5]}\n${[...new Set(doc.entries.flatMap(e=>e.channels))].map(c=>names[c]).join(', ')}`,`7/7 · ${steps[6]}\n${blockers.length?`⚠️ ${blockers.length} ${t('offene Angaben – im Admin prüfbar','missing details – complete in admin')}`:t('Bereit für die Inhaberprüfung.','Ready for owner review.')}`,t('Absenden speichert einen Entwurf zur Inhaberprüfung. Es veröffentlicht nichts.','Submit sends this draft for owner review. It does not publish anything.')].join('\n\n');
        buttons=[[b(t('Zur Inhaberprüfung senden','Submit for owner review'),'submit')],[b(t('✏️ Angaben bearbeiten','✏️ Edit details'),'editMenu')]];
        if(!state.updateOnly)buttons.push([b(t('Weitere Version hinzufügen','Add another version'),'addVersion')]);
        break;
      }
    }
  }
  if(state.guided && ['stock','price','battery','notes','accessories','photos'].includes(state.stage)){
    if(state.stage==='price')text=t('2/7 · Verkaufspreis in €? Zum Beispiel 699,90.','2/7 · Selling price in €? For example 699.90.');
    text=`${doc.shared.brand} ${doc.shared.model} · ${[entry.color,entry.storage].filter(Boolean).join(' · ')}\n\n${text}`;
  }
  if (['color', 'price'].includes(state.stage) && !state.updateOnly && !state.guided)
    buttons.unshift([
      b(t('Neu', 'New'), 'setCondition:new'),
      b(t('Open-Box', 'Open box'), 'setCondition:open_box'),
      b(t('Gebraucht', 'Used'), 'setCondition:used'),
    ]);
  if (state.stage === 'configuration') {
    text = `${versionLabel(entry)}\n${text}`;
    buttons.unshift([
      b(t('Angaben behalten / weiter', 'Keep details / continue'), 'choose:-'),
    ]);
  }
  if ((['notes', 'accessories'].includes(state.stage) && !state.guided) || ['gtin', 'mpn'].includes(state.stage))
    buttons.unshift([b(t('Keine / unbekannt', 'None / unknown'), 'choose:-')]);
  if (
    ['color', 'storage'].includes(state.stage) &&
    ['parts', 'accessories'].includes(doc.shared.category ?? '')
  )
    buttons.unshift([b(t('Nicht anwendbar', 'Not applicable'), 'choose:-')]);
  if(state.guided){
    if(!['review','edit_menu','researching'].includes(state.stage))buttons.push([b(t('← Zurück','← Back'),'back'),b(t('💾 Speichern & beenden','💾 Save & exit'),'save')]);
    else if(state.stage!=='edit_menu')buttons.push([b(t('💾 Speichern & beenden','💾 Save & exit'),'save')]);
  }else buttons.push([b(t('← Zurück', '← Back'), 'back'),b(t('Speichern & beenden', 'Save & exit'), 'save')],[b(t('Abbrechen', 'Cancel'), 'cancel')]);
  return {
    text,
    locale: l,
    buttons,
    revision,
    pending: state.stage === 'researching' && !state.researchError,
  };
};
export const newPhotoSlot = (url: string): { id: string; url: string } => ({
  id: randomUUID(),
  url,
});
