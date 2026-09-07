import { beforeAll, describe, expect, it } from 'vitest';
import { uploadProductImage } from '@/lib/blob';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { query } from '@/lib/db';
import {
  createPhoneDraft,
  loadPhoneDraft,
  savePhoneDraft,
  publishPhoneDraft,
} from './repository';
import { newPhoneEntry, type PhoneDraft, type PhoneEntry } from './model';

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
  it('cannot turn an individual device into bulk inventory', async () => {
    const result = await publish(await seed([await ready('used')]));
    result.document.entries[0].stock = 2;
    const draft = await savePhoneDraft(
      result.id,
      result.revision,
      result.document,
      'editor',
    );
    await expect(publish(draft)).rejects.toThrow(
      'individual_quantity_required',
    );
    expect(
      (
        await query('SELECT stock FROM products WHERE id=$1', [
          result.results[0].productId,
        ])
      ).rows[0].stock,
    ).toBe(1);
  });
  it('keeps changes off the live listing until explicit publish and rejects intervening live changes', async () => {
    const initial = await publish(await seed());
    const id = initial.results[0].productId;
    const edit = await createPhoneDraft('editor', id);
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
  it('rejects duplicate image bytes and reuse of used-device evidence', async () => {
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
    await expect(publish(await seed([clone]))).rejects.toThrow(
      'device_photo_reused',
    );
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
});
