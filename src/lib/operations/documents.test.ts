import { it,expect } from 'vitest';
import { renderAssetBarcode,renderTrainingReceipt } from './documents';
import bwipjs from 'bwip-js/node';
import sharp from 'sharp';
import { BinaryBitmap,HybridBinarizer,MultiFormatReader,RGBLuminanceSource } from '@zxing/library';
it('produces a printable Code 128 label without sensitive identifiers',()=>{
  const svg=renderAssetBarcode('APF-00000024');expect(svg).toContain('<svg');expect(svg).toContain('viewBox');
  expect(svg).not.toContain('IMEI');expect(svg).not.toContain('<script');
});
it('does not encode arbitrary input as a device label',()=>expect(()=>renderAssetBarcode('<script>')).toThrow('invalid_label'));
it('rejects a receipt whose stored totals do not reconcile',async()=>{
  await expect(renderTrainingReceipt({payload:{lines:[{unitCents:100,quantity:1,totalCents:100}],totalCents:101}})).rejects.toThrow('document_integrity_failed');
});
it('round-trips an asset label through an independent barcode decoder',async()=>{
  const png=await bwipjs.toBuffer({bcid:'code128',text:'APF-00000024',scale:3,height:15,padding:15});
  const {data,info}=await sharp(png).flatten({background:'#ffffff'}).greyscale().removeAlpha().raw().toBuffer({resolveWithObject:true});
  const bitmap=new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(new Uint8ClampedArray(data),info.width,info.height)));
  expect(new MultiFormatReader().decode(bitmap,new Map()).getText()).toBe('APF-00000024');
});
