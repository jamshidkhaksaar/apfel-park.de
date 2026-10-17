import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {describe,expect,it} from 'vitest';
import {newConversation,transition} from './model';
import {normalizeTelegramOfferDocument,setTelegramAccessories} from './offer-content';
import {newPhoneDocument} from '@/lib/smartphone-editor/model';
import {defaultOfferPresets} from '@/lib/product-offer-options';
import {sanitizeProductExperienceProfile} from '@/lib/product-experience';
import OfferGiftFields from '@/components/admin/OfferGiftFields';

describe('German Telegram shop content and admin accessory selections',()=>{
  it('stores German defaults and checks all four admin gifts even from an English chat',()=>{
    let {state,document}=newConversation('en');state.stage='notes';
    const act=(action:string)=>{({state,document}=transition(state,document,{action}));};
    act('defectNone');for(const key of ['charger','case','protector','usb_c'])act('accessory:'+key);act('accessoryDone');
    const entry=document.entries[0];
    expect(state.locale).toBe('en');
    expect(entry.conditionNote).toBe('Keine sichtbaren Mängel gemeldet.');
    expect(entry.defects).toBe('Keine sichtbaren Mängel gemeldet.');
    expect(entry.accessories).toContain('Ladegerät / Netzteil');expect(entry.accessories).toContain('USB-C-Kabel');
    expect(entry.experience?.packageContents.map(item=>item.presetId)).toEqual(['charger','case','protector','usb-cable']);
    expect(entry.experience?.enabledSections.packageContents).toBe(true);expect(entry.details.chargerIncluded).toBe(true);
    const html=renderToStaticMarkup(createElement(OfferGiftFields,{locale:'de',entry,presets:defaultOfferPresets(),chargerIncluded:entry.details.chargerIncluded,onChange:()=>{}}));
    expect(html.match(/type="checkbox" checked=""/g)).toHaveLength(4);
    expect(html).toContain('<option value="true" selected="">');
  });
  it('updates charger status on deselection and explicit no accessories without losing other details',()=>{
    const entry=newPhoneDocument().entries[0];entry.details.usbPdSupported=true;
    setTelegramAccessories(entry,['charger','case']);setTelegramAccessories(entry,['case']);
    expect(entry.details.chargerIncluded).toBe(false);expect(entry.details.usbPdSupported).toBe(true);
    setTelegramAccessories(entry,[]);expect(entry.accessories).toBe('');expect(entry.experience?.packageContents).toEqual([]);
    expect(entry.telegramAccessoriesConfirmed).toBe(true);
  });
  it('repairs a legacy draft on read without modifying its input or losing photos, price, or permanent defect text',()=>{
    const doc=newPhoneDocument();doc.telegramSessionId=crypto.randomUUID();
    Object.assign(doc.entries[0],{conditionNote:'No visible defects reported.',defects:'No visible defects reported.',accessories:'Charger / power adapter, Screen protector, Case, USB-C cable',price:399});
    const before=JSON.stringify(doc);const repaired=normalizeTelegramOfferDocument(doc);const entry=repaired.entries[0];
    expect(JSON.stringify(doc)).toBe(before);expect(entry.conditionNote).toBe('Keine sichtbaren Mängel gemeldet.');expect(entry.defects).toBe(entry.conditionNote);
    expect(entry.experience?.packageContents).toHaveLength(4);expect(entry.experience?.packageContents.every(item=>item.included && item.isGift && item.presetId)).toBe(true);
    expect(entry.price).toBe(399);expect(entry.photos).toEqual(doc.entries[0].photos);
    expect(normalizeTelegramOfferDocument(repaired)).toEqual(repaired);
  });
  it('preserves subsequent admin unchecks rather than restoring stale plain text',()=>{
    const doc=newPhoneDocument();doc.telegramSessionId=crypto.randomUUID();setTelegramAccessories(doc.entries[0],['charger','case']);
    doc.entries[0].experience!.packageContents=[];doc.entries[0].details.chargerIncluded=false;
    expect(normalizeTelegramOfferDocument(doc).entries[0].experience?.packageContents).toEqual([]);
    expect(normalizeTelegramOfferDocument(doc).entries[0].details.chargerIncluded).toBe(false);
  });
  it('never treats manufacturer box contents or unknown charger status as staff-confirmed gifts',()=>{
    const doc=newPhoneDocument();doc.telegramSessionId=crypto.randomUUID();
    doc.entries[0].experience=sanitizeProductExperienceProfile({packageContents:[{label:{de:'Ladegerät',en:'Charger'},included:true}]});
    const entry=normalizeTelegramOfferDocument(doc).entries[0];
    expect(entry.telegramAccessoriesConfirmed).toBeUndefined();expect(entry.details.chargerIncluded).toBeUndefined();expect(entry.experience?.packageContents[0].isGift).toBeUndefined();
  });
  it('keeps custom items and HDMI distinct from the USB-cable preset',()=>{
    const entry=newPhoneDocument().entries[0];setTelegramAccessories(entry,['hdmi','custom:Tragetasche','box']);
    expect(entry.experience?.packageContents.map(item=>item.presetId)).toEqual([undefined,undefined,undefined]);
    expect(entry.experience?.packageContents.map(item=>item.icon)).toEqual(['usb','gift','box']);
    const presets=defaultOfferPresets();presets.gifts=presets.gifts.filter(item=>item.id!=='charger');setTelegramAccessories(entry,['charger'],presets);
    expect(entry.experience?.packageContents[0].presetId).toBeUndefined();expect(entry.details.chargerIncluded).toBe(true);
  });
  it('does not rewrite unrelated drafts or translate arbitrary staff descriptions',()=>{
    const doc=newPhoneDocument();doc.entries[0].defects='Small frame scratch';
    expect(normalizeTelegramOfferDocument(doc)).toBe(doc);
    doc.telegramSessionId=crypto.randomUUID();expect(normalizeTelegramOfferDocument(doc).entries[0].defects).toBe('Small frame scratch');
  });
});
