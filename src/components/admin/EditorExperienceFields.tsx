'use client';

import { useState, type SetStateAction } from 'react';
import ProductExperiencePanel from './ProductExperiencePanel';
import { sanitizeProductExperienceProfile, type ProductExperienceProfile } from '@/lib/product-experience';
import type { ExperienceCandidate, ExperienceFamilyState } from '@/lib/admin-product-types';

const resolve = <T,>(action: SetStateAction<T>, current: T): T => typeof action === 'function' ? (action as (previous: T) => T)(current) : action;
export default function EditorExperienceFields({ locale, value, family, candidates, onChange, onFamilyChange }: {
  locale: 'de' | 'en'; value?: ProductExperienceProfile; family?: ExperienceFamilyState; candidates: ExperienceCandidate[];
  onChange: (profile: ProductExperienceProfile) => void; onFamilyChange: (family: ExperienceFamilyState) => void;
}) {
  const profile = value ?? sanitizeProductExperienceProfile({});
  const familyState = family ?? { name: '', slug: '', optionAxes: ['color', 'storage', 'condition'], isActive: true, members: [] };
  const [tab, setTab] = useState<'features' | 'family' | 'contents' | 'condition' | 'trust' | 'compare' | 'campaign'>('features');
  const [raw, setRaw] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const lines = (rows: string[][]) => rows.map(row => row.join(' | ')).join('\n');
  const contents = lines(profile.packageContents.map(item => [item.label.de, item.label.en, item.included ? 'yes' : 'no']));
  const conditions = lines(profile.conditionGuide.map(item => [item.condition, item.label.de, item.label.en, item.description.de, item.description.en, item.imageUrls.join(',')]));
  const [contentsRaw, setContentsRaw] = useState<string | null>(null);
  const [conditionsRaw, setConditionsRaw] = useState<string | null>(null);
  const rows = (text: string) => text.split('\n').map(line => line.split('|').map(part => part.trim())).filter(row => row.some(Boolean));
  return <ProductExperiencePanel locale={locale}
    experienceProfile={profile} setExperienceProfile={action => { setContentsRaw(null); setConditionsRaw(null); onChange(resolve(action, profile)); }}
    experienceTab={tab} setExperienceTab={setTab} experienceRawMode={raw} setExperienceRawMode={setRaw}
    experienceContentsText={contentsRaw ?? contents} setExperienceContentsText={action => setContentsRaw(resolve(action, contentsRaw ?? contents))}
    experienceConditionText={conditionsRaw ?? conditions} experienceLines={lines}
    syncContentsFromRaw={text => { setContentsRaw(text); onChange({ ...profile, packageContents: rows(text).map(([de, en, included]) => ({ label: { de: de ?? '', en: en || de || '' }, included: included !== 'no' })) }); }}
    syncConditionFromRaw={text => { setConditionsRaw(text); onChange({ ...profile, conditionGuide: rows(text).map(([condition, de, en, descriptionDe, descriptionEn, urls]) => ({ condition: condition === 'used' || condition === 'open_box' ? condition : 'new', label: { de: de ?? '', en: en || de || '' }, description: { de: descriptionDe ?? '', en: descriptionEn || descriptionDe || '' }, imageUrls: (urls ?? '').split(',').filter(Boolean) })) }); }}
    familyQuery={query} setFamilyQuery={setQuery} candidateProducts={candidates}
    familyState={familyState} setFamilyState={action => onFamilyChange(resolve(action, familyState))}
  />;
}
