import { beforeAll, describe, expect, it, vi } from 'vitest';
import { uploadProductImage } from '@/lib/blob';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { query } from '@/lib/db';
import {
  createPhoneDraft,
  loadPhoneDraft,
  listPhoneDrafts,
  savePhoneDraft,
  publishPhoneDraft,
  deletePhoneDrafts,
  removePhoneDraftProduct,
} from './repository';
import { newPhoneEntry, type PhoneDraft, type PhoneEntry } from './model';
import { getFamilyOptionTarget, sanitizeProductExperienceProfile } from '@/lib/product-experience';
import { autoPublishProductPromotion } from '@/lib/marketing';
import { readOfferPresets, saveOfferPresets } from '@/lib/product-offer-presets-repository';
import { productDeletionPreview, deleteCatalogProduct } from '@/lib/product-deletion';
import { catalogStockSummary } from '@/lib/catalog-stock-summary';
import { getProductExperienceView, getProductFamilyForProduct } from '@/lib/product-experience-repository';
import { parseStoreCatalogFilters, getStoreCatalog, getProductBySlug } from '@/lib/products';
vi.mock('server-only',()=>({}));
vi.mock('@/lib/marketing', () => ({ autoPublishProductPromotion: vi.fn().mockResolvedValue([]) }));

const enabled = process.env.PHONE_EDITOR_INTEGRATION === '1';
describe.skipIf(!enabled)('phone editor — real PostgreSQL transactions', () => {
  beforeAll(async () => {
    const result = await query('SELECT current_database() AS db');
    if (result.rows[0].db !== 'apfel_phone_test')
      throw new Error('Integration tests require isolated apfel_phone_test');
    await query(
      "INSERT INTO marketplace_channel_settings(marketplace) VALUES('google_merchant'),('ebay_de'),('amazon_de') ON CONFLICT DO NOTHING",
    );
  });
  const ready = async (
    condition: PhoneEntry['condition'] = 'new',
    color = 'Black',
  ): Promise<PhoneEntry> => {
    const e = newPhoneEntry();
    e.condition = condition;
    e.color = color;
    e.storage = '256 GB';
    e.price = 499;
    e.stock = condition === 'new' ? 5 : 1;
    e.conditionNote = condition === 'new' ? '' : 'Tested, minor scratches';
    e.hasRealProductPhotos = condition !== 'new';
    e.batteryHealth = condition === 'new' ? null : 94;
    for (const p of e.photos) {
      const bytes = await sharp({
        create: {
          width: 120,
          height: 160,
          channels: 3,
          background: '#' + p.id.replaceAll('-', '').slice(0, 6),
        },
      })
        .jpeg()
        .toBuffer();
      p.url = (
        await uploadProductImage(
          new File([new Uint8Array(bytes)], `fixture-${p.id}.jpg`, {
            type: 'image/jpeg',
          }),
        )
      ).url;
    }
    return e;
  };
  const seed = async (entries?: PhoneEntry[]): Promise<PhoneDraft> => {
    const d = await createPhoneDraft('test-admin');
    d.document.shared = {
      title: 'Apple iPhone 16 Pro',
      brand: 'Apple',
      model: `iPhone 16 Pro ${randomUUID().slice(0, 8)}`,
      category: 'smartphones',
      description: 'A tested phone.',
    };
    d.document.entries = entries ?? [await ready()];
    return savePhoneDraft(d.id, d.revision, d.document, 'test-admin');
  };
  const publish = (d: PhoneDraft, requestId = randomUUID()) =>
    publishPhoneDraft(
      d.id,
      {
        revision: d.revision,
        requestId,
        entryIds: d.document.entries.map((e) => e.id),
      },
      'test-admin',
      true,
    );
  it('keeps battery tiers as independent priced offers in the customer selector', async () => {
    const low=await ready('used');const high=await ready('used'); low.experience=sanitizeProductExperienceProfile({enabledSections:{packageContents:true},packageContents:[{label:{en:'Cable',de:'Kabel'},included:true}]});high.experience=sanitizeProductExperienceProfile({});low.batteryHealth=90;low.price=399;high.batteryHealth=95;high.batteryHealthMax=100;high.price=449;
    const result=await publish(await seed([low,high]));
    const family=await getProductFamilyForProduct(result.results[0].productId,'en');
    expect(family?.optionAxes).toContain('batteryHealth');
    expect(family?.members.map(member=>member.optionValues.batteryHealth).sort()).toEqual(['90%','95–100%']);
    expect(family?.members.map(member=>member.price).sort()).toEqual([399,449]);
    const view=await getProductExperienceView(result.results[0].productId,'en');
    expect(view.family?.members).toHaveLength(2);expect(view.profile.enabledSections.familyConfigurator).toBe(true);
    await query("UPDATE product_experience_profiles SET enabled_sections=jsonb_set(enabled_sections,'{familyConfigurator}','false') WHERE product_id=$1",[result.results[0].productId]);
    expect((await getProductExperienceView(result.results[0].productId,'en')).family?.members).toHaveLength(2);
  });
  it('keeps selectors and independent availability after updating existing offers', async () => {
    const low = await ready('used');
    const high = await ready('used');
    low.batteryHealth = 90; low.price = 399; low.stock = 2;
    high.batteryHealth = 95; high.batteryHealthMax = 100; high.price = 449; high.stock = 3;
    const published = await publish(await seed([low, high]));
    const id = published.results[0].productId;
    const edit = await createPhoneDraft('test-admin', id);
    expect(edit.document.entries).toHaveLength(2);
    const entry = edit.document.entries.find(item => item.sourceProductId === id)!;
    entry.price = 419; entry.stock = 4;
    entry.experience = sanitizeProductExperienceProfile({ enabledSections: { familyConfigurator: false, packageContents: true }, packageContents: [{ label: { en: 'Case', de: 'Hülle' }, included: true, icon: 'case' }] });
    await publish(await savePhoneDraft(edit.id, edit.revision, edit.document, 'test-admin'));
    const view = await getProductExperienceView(id, 'en');
    expect(view.profile.enabledSections.familyConfigurator).toBe(true);
    expect(view.profile.packageContents[0].label.en).toBe('Case');
    expect(view.family?.members).toHaveLength(2);
    expect(view.family?.members.find(member => member.productId === id)).toMatchObject({ price: 419, stock: 4 });
    await query('UPDATE inventory_skus SET reserved=on_hand WHERE product_id=$1', [id]);
    const sold = await getProductFamilyForProduct(id, 'en');
    expect(sold!.members.find(member => member.productId === id)?.stock).toBe(0);
    const other = sold!.members.find(member => member.productId !== id)!;
    expect(other.stock).toBe(3);
    expect(getFamilyOptionTarget(sold!, 'batteryHealth', other.optionValues.batteryHealth)?.productId).toBe(other.productId);
  });
  it('publishes and updates without inheriting a hidden shared comparison price', async () => {
    const draft = await seed();
    draft.document.shared.compareAtPrice = 400;
    draft.document.entries[0].price = 759;
    const saved = await savePhoneDraft(draft.id, draft.revision, draft.document, 'test-admin');
    const result = await publish(saved);
    const id = result.results[0].productId;
    expect((await query('SELECT compare_at_price FROM products WHERE id=$1', [id])).rows[0].compare_at_price).toBeNull();
    const edit = await createPhoneDraft('test-admin', id);
    edit.document.entries[0].details.compareAtPrice = 899;
    await publish(await savePhoneDraft(edit.id, edit.revision, edit.document, 'test-admin'));
    expect(Number((await query('SELECT compare_at_price FROM products WHERE id=$1', [id])).rows[0].compare_at_price)).toBe(899);
    const clear = await createPhoneDraft('test-admin', id);
    clear.document.entries[0].details.compareAtPrice = null;
    await publish(await savePhoneDraft(clear.id, clear.revision, clear.document, 'test-admin'));
    expect((await query('SELECT compare_at_price FROM products WHERE id=$1', [id])).rows[0].compare_at_price).toBeNull();
  });
  it('removes a published version atomically and preserves edited and unpublished sibling versions', async () => {
    const initial = await seed([await ready('used'), await ready('used', 'Blue')]);
    const published = await publish(initial);
    const id = published.results[0].productId;
    const edit = await createPhoneDraft('test-admin', id);
    const target = edit.document.entries.find(entry => entry.sourceProductId === id)!;
    const sibling = edit.document.entries.find(entry => entry.sourceProductId !== id)!;
    sibling.price = 799;
    edit.document.entries.push(await ready('used', 'White'));
    const saved = await savePhoneDraft(edit.id, edit.revision, edit.document, 'test-admin');
    const preview = await productDeletionPreview(id);
    const input = {revision:saved.revision, entryId:target.id, fingerprint:preview.fingerprint, confirmation:'DELETE'};
    await expect(removePhoneDraftProduct(saved.id, {...input,revision:saved.revision-1}, 'test-admin')).rejects.toMatchObject({message:'conflict'});
    await expect(removePhoneDraftProduct(saved.id, {...input,confirmation:''}, 'test-admin')).rejects.toMatchObject({message:'confirmation_required'});
    await query('UPDATE inventory_skus SET reserved=1 WHERE product_id=$1', [id]);
    const reserved = await productDeletionPreview(id);
    await expect(removePhoneDraftProduct(saved.id, {...input,fingerprint:reserved.fingerprint}, 'test-admin')).rejects.toMatchObject({message:'reservations'});
    expect((await loadPhoneDraft(saved.id)).document.entries).toHaveLength(3);
    await query('UPDATE inventory_skus SET reserved=0 WHERE product_id=$1', [id]);
    const fresh = await productDeletionPreview(id);
    const removed = await removePhoneDraftProduct(saved.id, {...input,fingerprint:fresh.fingerprint}, 'test-admin');
    expect(removed.document.entries).toEqual(saved.document.entries.filter(entry => entry.sourceProductId !== id));
    expect(removed.document.family?.members.some(member => member.productId === id)).toBe(false);
    expect((await query('SELECT is_active,catalog_enabled FROM products WHERE id=$1', [id])).rows[0]).toEqual({is_active:false,catalog_enabled:false});
    expect((await query('SELECT on_hand,is_active FROM inventory_skus WHERE product_id=$1', [id])).rows[0]).toMatchObject({on_hand:1,is_active:false});
    const republished = await publish(removed);
    expect(republished.results).toHaveLength(2);
    expect((await query('SELECT price FROM products WHERE id=$1', [sibling.sourceProductId])).rows[0].price).toBe('799.00');
    expect((await query('SELECT is_active FROM products WHERE id=$1', [id])).rows[0].is_active).toBe(false);
  });
  it('preserves a pre-existing presentation conflict on a remaining version', async () => {
    const published = await publish(await seed([await ready('used'), await ready('used', 'Blue')]));
    const id = published.results[0].productId;
    const edit = await createPhoneDraft('test-admin', id);
    const target = edit.document.entries.find(entry => entry.sourceProductId === id)!;
    const sibling = edit.document.entries.find(entry => entry.sourceProductId !== id)!;
    await query("UPDATE product_experience_profiles SET enabled_sections=jsonb_set(enabled_sections,'{packageContents}','true') WHERE product_id=$1", [sibling.sourceProductId]);
    const preview = await productDeletionPreview(id);
    const removed = await removePhoneDraftProduct(edit.id, {revision:edit.revision,entryId:target.id,fingerprint:preview.fingerprint,confirmation:'DELETE'}, 'test-admin');
    await expect(publish(removed)).rejects.toMatchObject({message:'conflict'});
  });
  it('keeps an editable blank starter after removing the last published offer', async () => {
    const published = await publish(await seed());
    const id = published.results[0].productId;
    const edit = await createPhoneDraft('test-admin', id);
    const preview = await productDeletionPreview(id);
    const removed = await removePhoneDraftProduct(edit.id, {revision:edit.revision,entryId:edit.document.entries[0].id,fingerprint:preview.fingerprint,confirmation:'DELETE'}, 'test-admin');
    expect(removed.document.entries).toHaveLength(1);
    expect(removed.document.entries[0].sourceProductId).toBeUndefined();
    await expect(savePhoneDraft(removed.id, removed.revision, removed.document, 'test-admin')).resolves.toBeDefined();
  });
  it('groups researched offers before pagination while preserving capacity filters', async () => {
    const low=await ready('used');low.storage='128 GB';low.price=399;
    const high=await ready('used');high.storage='256 GB';high.price=499;
    const blue=await ready('used','Blue');blue.storage='128 GB';blue.price=449;
    for(const offer of [low,high,blue]) offer.experience=sanitizeProductExperienceProfile({});
    const draft=await seed([low,high,blue]);await publish(draft);
    const catalog=await getStoreCatalog({filters:parseStoreCatalogFilters({q:draft.document.shared.model}),pageSize:1,locale:'en'});
    expect(catalog.total).toBe(1);expect(catalog.pages).toBe(1);expect(catalog.products).toHaveLength(1);
    expect(catalog.products[0]).toMatchObject({price:399,stock:1,storeFamily:{stock:3,offerCount:3,colors:expect.arrayContaining(['Black','Blue']),storages:['128GB','256GB']}});
    expect(catalog.facets.storages).toEqual([{value:'128GB',count:1},{value:'256GB',count:1}]);
    const filtered=await getStoreCatalog({filters:parseStoreCatalogFilters({q:draft.document.shared.model,storage:'256GB'}),locale:'en'});
    expect(filtered.total).toBe(1);expect(filtered.products[0].price).toBe(499);
    expect(filtered.products[0].storeFamily?.offerCount).toBe(1);
  });
  it('archives a deleted offer and stock history, blocks reserved deletion and prevents resurrection', async () => {
    const draft=await seed([await ready('used')]);const result=await publish(draft);const id=result.results[0].productId;
    await query('UPDATE inventory_skus SET reserved=1 WHERE product_id=$1',[id]);
    let preview=await productDeletionPreview(id);
    await expect(deleteCatalogProduct(id,{confirmation:'DELETE',fingerprint:preview.fingerprint},'test-admin')).rejects.toMatchObject({message:'reservations'});
    await query('UPDATE inventory_skus SET reserved=0 WHERE product_id=$1',[id]);
    await expect(deleteCatalogProduct(id,{confirmation:'DELETE',fingerprint:preview.fingerprint},'test-admin')).rejects.toMatchObject({message:'conflict'});
    preview=await productDeletionPreview(id);
    await expect(deleteCatalogProduct(id,{},'test-admin')).rejects.toMatchObject({message:'confirmation_required'});
    await deleteCatalogProduct(id,{confirmation:'DELETE',fingerprint:preview.fingerprint},'test-admin');
    const row=(await query('SELECT is_active,catalog_enabled,slug,import_metadata FROM products WHERE id=$1',[id])).rows[0];
    expect(row).toMatchObject({is_active:false,catalog_enabled:false});expect(row.import_metadata.catalogDeletedBy).toBe('test-admin');
    expect((await query('SELECT on_hand,is_active FROM inventory_skus WHERE product_id=$1',[id])).rows[0]).toMatchObject({on_hand:1,is_active:false});
    expect(await getProductBySlug(row.slug,'en')).toBeNull();
    await expect(createPhoneDraft('test-admin',id)).rejects.toMatchObject({message:'not_found'});
    await query('UPDATE products SET is_active=true,catalog_enabled=true WHERE id=$1',[id]);
    expect((await query('SELECT is_active,catalog_enabled FROM products WHERE id=$1',[id])).rows[0]).toEqual({is_active:false,catalog_enabled:false});
    await expect(publish({...draft,revision:result.revision})).rejects.toMatchObject({message:'conflict'});
  });
  it('cleans drafts atomically with stale-revision protection and leaves published offers intact', async () => {
    const one=await seed();const two=await seed();const published=await publish(one);
    await expect(deletePhoneDrafts([{id:one.id,revision:one.revision},{id:two.id,revision:two.revision}],'test-admin')).rejects.toMatchObject({message:'conflict'});
    expect(await loadPhoneDraft(two.id)).toMatchObject({id:two.id});
    await deletePhoneDrafts([{id:one.id,revision:published.revision},{id:two.id,revision:two.revision}],'test-admin');
    await expect(loadPhoneDraft(one.id)).rejects.toMatchObject({message:'not_found'});
    await expect(loadPhoneDraft(two.id)).rejects.toMatchObject({message:'not_found'});
    expect((await query('SELECT is_active FROM products WHERE id=$1',[published.results[0].productId])).rows[0].is_active).toBe(true);
  });
  it('summarizes all filtered units by model with per-variant prices', async () => {
    const draft=await seed();const model=draft.document.shared.model!;const one=await publish(draft);const id=one.results[0].productId;
    await query("UPDATE products SET variants=$2::jsonb,stock=10 WHERE id=$1",[id,JSON.stringify([{color:'Black',storage:'128',price:400,stock:8},{color:'Black',storage:'256',price:500,stock:2}])]);
    const summary=await catalogStockSummary('WHERE model=$1 AND catalog_enabled=true',[model]);
    expect(summary).toMatchObject({listings:1,units:10,value:4200});expect(summary.models[0].model).toBe(model);
  });
  it('persists editable presets and prevents stale global-default overwrites', async () => {
    const before = await readOfferPresets();
    before.conditionNotes[2].text.en = 'QA A+ note';
    before.gifts.push({ id: 'test-gift', icon: 'gift', label: { de: 'Testgeschenk', en: 'QA gift' } });
    const saved = await saveOfferPresets(before);
    expect(saved.revision).toBe(before.revision + 1);
    expect(await readOfferPresets()).toEqual(saved);
    await expect(saveOfferPresets(before)).rejects.toThrow('presets_conflict');
  });
  it('publishes and reloads a battery range and gifts without an invented exact measurement', async () => {
    const entry = await ready('used');
    entry.batteryHealth = 95; entry.batteryHealthMax = 100;
    entry.conditionNotePresetId = 'grade-aplus';
    entry.experience = sanitizeProductExperienceProfile({ enabledSections: { packageContents: true }, packageContents: [{ label: { de: 'Hülle', en: 'Case' }, included: true, icon: 'case', isGift: true, presetId: 'case' }] });
    entry.details.chargerIncluded = false;
    const published = await publish(await seed([entry]));
    const id = published.results[0].productId;
    const row = (await query('SELECT slug,battery_health,import_metadata,charger_included FROM products WHERE id=$1', [id])).rows[0];
    expect(row.battery_health).toBeNull();
    expect(row.import_metadata.batteryHealthRange).toEqual({ min: 95, max: 100 });
    expect(row.charger_included).toBe(false);
    expect((await getProductBySlug(row.slug, 'en'))?.batteryHealthRange).toEqual({ min: 95, max: 100 });
    const edit = await createPhoneDraft('editor', id);
    expect(edit.document.entries[0]).toMatchObject({ batteryHealth: 95, batteryHealthMax: 100, conditionNotePresetId: 'grade-aplus', experience: { packageContents: [{ icon: 'case', isGift: true, presetId: 'case' }] } });
    edit.document.entries[0].batteryHealth = 97; edit.document.entries[0].batteryHealthMax = null;
    await publish(await savePhoneDraft(edit.id, edit.revision, edit.document, 'editor'));
    const measured = (await query('SELECT battery_health,import_metadata FROM products WHERE id=$1', [id])).rows[0];
    expect(measured.battery_health).toBe(97);
    expect(measured.import_metadata.batteryHealthRange).toBeNull();
  });
  it('saves incomplete drafts, restores photos, and rejects a stale concurrent save', async () => {
    const d = await createPhoneDraft('test-admin');
    const updated = await savePhoneDraft(
      d.id,
      d.revision,
      d.document,
      'test-admin',
    );
    expect((await loadPhoneDraft(d.id)).revision).toBe(updated.revision);
    await expect(
      savePhoneDraft(d.id, d.revision, d.document, 'other'),
    ).rejects.toThrow('conflict');
    await expect(publish(updated)).rejects.toThrow('entry_incomplete');
  });
  it('publishes two new colors, one open-box and two identical used devices independently and retry-safely', async () => {
    const d = await seed([
      await ready('new', 'Black'),
      await ready('new', 'White'),
      await ready('open_box'),
      await ready('used'),
      await ready('used'),
    ]);
    d.document.entries[1].stock = 3;
    d.document.entries[1].price = 549;
    d.document.entries[2].price = 449;
    d.document.entries[3].price = 399;
    d.document.entries[4].price = 389;
    d.document.entries[3].batteryHealth = 93;
    d.document.entries[4].batteryHealth = 88;
    const changed = await savePhoneDraft(
      d.id,
      d.revision,
      d.document,
      'test-admin',
    );
    d.revision = changed.revision;
    const request = randomUUID();
    const result = await publish(d, request);
    expect(new Set(result.results.map((r) => r.productId)).size).toBe(5);
    expect(
      result.results.every(
        (r) =>
          r.channels.store === 'published' &&
          r.channels.amazon === 'incomplete',
      ),
    ).toBe(true);
    expect((await publish(d, request)).results).toEqual(result.results);
    const rows = (
      await query('SELECT * FROM products WHERE id=ANY($1::uuid[])', [
        result.results.map((r) => r.productId),
      ])
    ).rows;
    expect(rows.map((r) => r.stock).sort()).toEqual([1, 1, 1, 3, 5]);
    expect(rows.every((r) => r.is_active)).toBe(true);
    const workspace = await createPhoneDraft('editor', rows[0].id);
    expect(workspace.document.entries).toHaveLength(5);
    expect(
      (
        await query(
          'SELECT family_id FROM product_family_members WHERE product_id=ANY($1::uuid[])',
          [rows.map((r) => r.id)],
        )
      ).rows,
    ).toHaveLength(5);
  });
  it('serializes simultaneous publish retries and keeps single-variant IDs across later edits', async () => {
    const d = await seed();
    const key = randomUUID();
    const [a, b] = await Promise.all([publish(d, key), publish(d, key)]);
    expect(a.results).toEqual(b.results);
    a.document.entries[0].price = 650;
    const saved = await savePhoneDraft(a.id, a.revision, a.document, 'editor');
    await publish(saved);
    const product = (
      await query('SELECT variants FROM products WHERE id=$1', [
        a.results[0].productId,
      ])
    ).rows[0];
    expect(product.variants).toHaveLength(1);
    expect(product.variants[0].price).toBe(650);
  });
  it('supports restocking a used offer with multiple units', async () => {
    const result = await publish(await seed([await ready('used')]));
    result.document.entries[0].stock = 2;
    const draft = await savePhoneDraft(
      result.id,
      result.revision,
      result.document,
      'editor',
    );
    await publish(draft);
    expect(
      (
        await query('SELECT stock FROM products WHERE id=$1', [
          result.results[0].productId,
        ])
      ).rows[0].stock,
    ).toBe(2);
  });
  it('keeps changes off the live listing until explicit publish and rejects intervening live changes', async () => {
    const initial = await publish(await seed());
    const id = initial.results[0].productId;
    const edit = await createPhoneDraft('editor', id);
    expect((await listPhoneDrafts(id)).some(d => d.id === edit.id)).toBe(true);
    expect(await listPhoneDrafts(randomUUID())).toEqual([]);
    edit.document.entries[0].price = 777;
    const saved = await savePhoneDraft(
      edit.id,
      edit.revision,
      edit.document,
      'editor',
    );
    expect(
      Number(
        (await query('SELECT price FROM products WHERE id=$1', [id])).rows[0]
          .price,
      ),
    ).toBe(499);
    await query('UPDATE products SET price=555,updated_at=now() WHERE id=$1', [
      id,
    ]);
    await expect(publish(saved)).rejects.toThrow('conflict');
  });
  it('detects inventory changes and preserves reservations on a fresh revision', async () => {
    const initial = await publish(await seed());
    const id = initial.results[0].productId;
    const edit = await createPhoneDraft('editor', id);
    await query(
      'UPDATE inventory_skus SET reserved=1,safety_buffer=1 WHERE product_id=$1',
      [id],
    );
    await expect(publish(edit)).rejects.toThrow('conflict');
    const fresh = await createPhoneDraft('editor', id);
    fresh.document.entries[0].stock = 3;
    const saved = await savePhoneDraft(
      fresh.id,
      fresh.revision,
      fresh.document,
      'editor',
    );
    await publish(saved);
    const ledger = (
      await query('SELECT * FROM inventory_skus WHERE product_id=$1', [id])
    ).rows[0];
    expect([ledger.on_hand, ledger.reserved, ledger.safety_buffer]).toEqual([
      5, 1, 1,
    ]);
  });
  it('rejects duplicate views but permits confirmed reuse of used-device photos', async () => {
    const e = await ready('used');
    const d = await seed([e]);
    d.document.entries[0].photos[1].url = e.photos[0].url;
    let saved = await savePhoneDraft(d.id, d.revision, d.document, 'editor');
    await expect(publish(saved)).rejects.toThrow('entry_incomplete');
    const used = await ready('used');
    saved = await seed([used]);
    await publish(saved);
    const clone = await ready('used');
    clone.photos = clone.photos.map((p, i) => ({
      ...p,
      url: used.photos[i].url,
    }));
    const reuse = await seed([clone]);
    await expect(publish(reuse)).rejects.toThrow('shared_photos_confirmation_required');
    const reviewed = await publishPhoneDraft(reuse.id, { revision: reuse.revision, requestId: randomUUID(), entryIds: [clone.id], confirmedSharedPhotos: true }, 'editor', true);
    expect(reviewed.results[0].channels.store).toBe('published');
  });
  it('rolls back every product when any SKU conflicts', async () => {
    const original = await publish(await seed());
    const existingSku = original.document.entries[0].sku;
    const first = await ready('new', 'Red');
    const second = await ready('new', 'Blue');
    second.sku = existingSku;
    const d = await seed([first, second]);
    await expect(publish(d)).rejects.toThrow('duplicate_sku');
    expect(
      (await query('SELECT id FROM products WHERE sku=$1', [first.sku]))
        .rowCount,
    ).toBe(0);
  });
  it('preserves legacy variant records, IDs, slugs and default selection', async () => {
    const initial = await publish(await seed());
    const id = initial.results[0].productId;
    const one = await ready('new', 'Black');
    const two = await ready('new', 'White');
    await query(`UPDATE products SET variants=$2::jsonb,stock=10 WHERE id=$1`, [
      id,
      JSON.stringify(
        [one, two].map((e, i) => ({
          color: e.color,
          storage: e.storage,
          sku: e.sku,
          price: e.price,
          stock: e.stock,
          images: e.photos.map((p) => p.url),
          isDefault: i === 1,
        })),
      ),
    ]);
    const before = (await query('SELECT slug FROM products WHERE id=$1', [id]))
      .rows[0];
    const edit = await createPhoneDraft('editor', id);
    expect(edit.document.entries).toHaveLength(2);
    await expect(
      publishPhoneDraft(
        edit.id,
        {
          revision: edit.revision,
          requestId: randomUUID(),
          entryIds: [edit.document.entries[0].id],
        },
        'editor',
        true,
      ),
    ).rejects.toThrow('select_all_legacy_variants');
    const updated = await publish(edit);
    expect(new Set(updated.results.map((r) => r.productId))).toEqual(
      new Set([id]),
    );
    const after = (
      await query('SELECT slug,variants FROM products WHERE id=$1', [id])
    ).rows[0];
    expect(after.slug).toBe(before.slug);
    expect(after.variants[1].isDefault).toBe(true);
  });
  it('publishes different storage offers from one color gallery and announces once per product', async () => {
    const first = await ready();
    first.photos = first.photos.slice(0, 1);
    first.coverId = first.photos[0].id;
    first.storage = '128 GB'; first.stock = 250; first.price = 399;
    const second = newPhoneEntry(first);
    second.storage = '256 GB'; second.stock = 1000; second.price = 499;
    const d = await seed([first, second]);
    vi.mocked(autoPublishProductPromotion).mockClear();
    const key = randomUUID();
    const published = await publish(d, key);
    const rows = (await query('SELECT price,stock,images FROM products WHERE id=ANY($1::uuid[]) ORDER BY price', [published.results.map(result => result.productId)])).rows;
    expect(rows.map(row => [Number(row.price), row.stock])).toEqual([[399, 250], [499, 1000]]);
    expect(rows[0].images).toEqual(rows[1].images);
    expect(rows[0].images).toHaveLength(1);
    expect(vi.mocked(autoPublishProductPromotion)).toHaveBeenCalledTimes(2);
    await publish(d, key);
    expect(vi.mocked(autoPublishProductPromotion)).toHaveBeenCalledTimes(2);
  });
  it('supports generic products, shared catalog assets, full presentation and homepage settings', async () => {
    const e = await ready();
    e.color = ''; e.storage = ''; e.photos = e.photos.slice(0, 1); e.coverId = e.photos[0].id;
    e.experience = { ...sanitizeProductExperienceProfile({}), dimensions: { heightMm: 100 }, packageContents: [{ label: { de: 'Kabel', en: 'Cable' }, included: true }], campaign: { badge: { de: 'Neu', en: 'New' }, message: { de: 'Details', en: 'Details' } } };
    e.details = { compareAtPrice: 599, isHomepageFeatured: true, faq: { en: [{ q: 'Compatibility?', a: 'USB-C' }] }, chargerIncluded: false, chargingPowerMaxW: 30 };
    const d = await seed([e]);
    d.document.shared.category = 'accessories';
    const saved = await savePhoneDraft(d.id, d.revision, d.document, 'editor');
    const published = await publish(saved);
    const id = published.results[0].productId;
    const product = (await query('SELECT category,compare_at_price,faq,charger_included,charging_power_max_w FROM products WHERE id=$1', [id])).rows[0];
    expect(product).toMatchObject({ category: 'accessories', faq: { en: [{ q: 'Compatibility?', a: 'USB-C' }] }, charger_included: false });
    expect(Number(product.compare_at_price)).toBe(599);
    const edit = await createPhoneDraft('editor', id);
    expect(edit.document.entries[0].experience).toMatchObject({ dimensions: { heightMm: 100 }, packageContents: [{ label: { en: 'Cable' } }] });
    expect(edit.document.entries[0].details.isHomepageFeatured).toBe(true);
    edit.document.entries[0].price = 510;
    await publish(await savePhoneDraft(edit.id, edit.revision, edit.document, 'editor'));
    expect(Number((await query('SELECT price FROM products WHERE id=$1', [id])).rows[0].price)).toBe(510);
    const copy = await ready();
    copy.photos = e.photos.map(photo => ({ ...photo, id: randomUUID() })); copy.coverId = copy.photos[0].id;
    expect((await publish(await seed([copy]))).results[0].channels.store).toBe('published');
  });
  it('preserves profile concurrency and writes inactive product and inventory flags atomically', async () => {
    const initial = await publish(await seed());
    const id = initial.results[0].productId;
    const edit = await createPhoneDraft('editor', id);
    await query("UPDATE product_experience_profiles SET dimensions='{" + '"heightMm":150' + "}'::jsonb WHERE product_id=$1", [id]);
    await expect(publish(edit)).rejects.toThrow('conflict');
    const fresh = await createPhoneDraft('editor', id);
    fresh.document.entries[0].details.isActive = false;
    const saved = await savePhoneDraft(fresh.id, fresh.revision, fresh.document, 'editor');
    await publish(saved);
    expect((await query('SELECT is_active FROM products WHERE id=$1', [id])).rows[0].is_active).toBe(false);
    expect((await query('SELECT is_active FROM inventory_skus WHERE product_id=$1', [id])).rows[0].is_active).toBe(false);
  });
});
