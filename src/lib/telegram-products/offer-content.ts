import { sanitizeProductExperienceProfile, type PackageContentItem } from '@/lib/product-experience';
import { defaultOfferPresets, type OfferIcon, type OfferPresets } from '@/lib/product-offer-options';
import type { PhoneDocument, PhoneEntry } from '@/lib/smartphone-editor/model';

export const telegramAccessoryChoices: Array<{key: string; de: string; en: string; icon: OfferIcon; presetId?: string}> = [
  {key:'box',de:'Originalkarton',en:'Original box',icon:'box'},
  {key:'usb_c',de:'USB-C-Kabel',en:'USB-C cable',icon:'usb',presetId:'usb-cable'},
  {key:'lightning',de:'Lightning-Kabel',en:'Lightning cable',icon:'usb',presetId:'usb-cable'},
  {key:'charger',de:'Ladegerät / Netzteil',en:'Charger / power adapter',icon:'charger',presetId:'charger'},
  {key:'case',de:'Hülle',en:'Case',icon:'case',presetId:'case'},
  {key:'protector',de:'Displayschutz',en:'Screen protector',icon:'screen-protector',presetId:'protector'},
  {key:'controller',de:'Controller',en:'Controller',icon:'gift'},
  {key:'hdmi',de:'HDMI-Kabel',en:'HDMI cable',icon:'usb'},
  {key:'bag',de:'Tasche',en:'Bag',icon:'gift'},
];
const choiceForLabel = (label: string) => telegramAccessoryChoices.find(item =>
  [item.de,item.en,...(defaultOfferPresets().gifts.filter(preset=>preset.id===item.presetId).flatMap(preset=>[preset.label.de,preset.label.en]))]
    .some(text=>text.toLowerCase()===label.trim().toLowerCase()));

export const setTelegramAccessories = (entry: PhoneEntry, keys: string[], presets: OfferPresets = defaultOfferPresets()): void => {
  const contents: PackageContentItem[] = keys.flatMap(key => {
    const choice=telegramAccessoryChoices.find(item=>item.key===key);
    if (!choice && !key.startsWith('custom:')) return [];
    const label=choice ? {de:choice.de,en:choice.en} : {de:key.slice(7),en:key.slice(7)};
    const preset=choice?.presetId ? presets.gifts.find(item=>item.id===choice.presetId && item.icon===choice.icon) : undefined;
    return [{label,included:true,isGift:true,icon:choice?.icon??'gift',...(preset?{presetId:preset.id}:{})}];
  });
  const profile=sanitizeProductExperienceProfile(entry.experience);
  entry.accessories=contents.map(item=>item.label.de).join(', ');
  entry.experience={...profile,enabledSections:{...profile.enabledSections,packageContents:true},packageContents:contents};
  entry.details={...entry.details,chargerIncluded:contents.some(item=>item.icon==='charger')};
  entry.telegramOfferContentVersion=1;
  entry.telegramAccessoriesConfirmed=true;
};

/** Repair only generated defaults and legacy bot selections; never translate arbitrary staff text. */
export const normalizeTelegramOfferDocument = (document: PhoneDocument, presets: OfferPresets = defaultOfferPresets()): PhoneDocument => {
  if (!document.telegramSessionId) return document;
  const next=structuredClone(document);
  for(const entry of next.entries){
    if(entry.telegramOfferContentVersion===1)continue;
    for(const field of ['conditionNote','defects'] as const){
      if(entry[field]==='No visible defects reported.')entry[field]='Keine sichtbaren Mängel gemeldet.';
      if(entry[field]==='None')entry[field]=field==='defects'?'Keine Mängel angegeben.':'Keine weiteren Zustandshinweise.';
    }
    const profile=sanitizeProductExperienceProfile(entry.experience);
    // Existing admin gift edits are authoritative; do not resurrect unchecked items
    // from the older plain-text summary.
    if(entry.accessories.trim() && !profile.packageContents.some(item=>item.isGift || item.presetId)){
      const labels=entry.accessories.split(/[,;\n]/).map(label=>label.trim()).filter(Boolean);
      const keys=labels.filter(label=>!/^none$/i.test(label)).map(label=>choiceForLabel(label)?.key??'custom:'+label);
      setTelegramAccessories(entry,keys,presets);
    }
    entry.telegramOfferContentVersion=1;
  }
  return next;
};
