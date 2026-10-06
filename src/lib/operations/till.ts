import type { TransactionClient } from '@/lib/db';
import { wholeQuantity, uuidPattern, type TillLine } from './types';
import { stockAvailabilitySql } from './stock-summary';

export const buildTillLines=async(client:TransactionClient,branchId:string,input:unknown):Promise<TillLine[]> => {
  if(!Array.isArray(input) || input.length<1 || input.length>100) throw new Error('invalid_basket');
  const lines:TillLine[]=[];const totals=new Map<string,number>();const assets=new Set<string>();
  for(const value of input) {
    if(!value || typeof value!=='object') throw new Error('invalid_basket');
    const item=value as Record<string,unknown>;const inventoryId=String(item.inventoryId ?? '');const assetId=item.assetId ? String(item.assetId):undefined;
    if(!uuidPattern.test(inventoryId) || assetId && !uuidPattern.test(assetId)) throw new Error('invalid_reference');
    const quantity=wholeQuantity(item.quantity);
    if(assetId && (quantity!==1 || assets.has(assetId))) throw new Error('invalid_basket');if(assetId) assets.add(assetId);
    const result=await client.query(`SELECT i.sku,p.title,p.condition,round(coalesce(nullif(v.value->>'price','')::numeric,p.price)*100)::bigint AS price,
      ${stockAvailabilitySql} AS available FROM inventory_skus i JOIN products p ON p.id=i.product_id
      JOIN ops_balances s ON s.inventory_id=i.id AND s.branch_id=$2
      LEFT JOIN LATERAL(SELECT value FROM jsonb_array_elements(CASE WHEN jsonb_typeof(p.variants)='array' THEN p.variants ELSE '[]' END)
        WHERE value->>'sku'=i.sku LIMIT 1) v ON true WHERE i.id=$1 AND i.location='local' AND i.is_active AND p.is_active`,[inventoryId,branchId]);
    const product=result.rows[0];if(!product || Number(product.price)<=0) throw new Error('product_not_sellable');
    const total=(totals.get(inventoryId) ?? 0)+quantity;totals.set(inventoryId,total);if(total>Number(product.available)) throw new Error('insufficient_stock');
    if(assetId && !(await client.query("SELECT 1 FROM ops_assets WHERE id=$1 AND inventory_id=$2 AND branch_id=$3 AND state='available'",[assetId,inventoryId,branchId])).rows.length) throw new Error('asset_unavailable');
    const unitCents=Number(product.price);lines.push({inventoryId,assetId,quantity,title:String(product.title),sku:String(product.sku),condition:String(product.condition),unitCents,totalCents:quantity*unitCents});
  }
  return lines;
};
