import path from 'node:path';
import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js/node';
import { businessIdentity,businessAddress } from '@/lib/business-identity';
import { query } from '@/lib/db';
import { assetLabel,type OperationsAccess,type TillLine } from './types';

export const renderAssetBarcode = (label: string): string => {
  if(!/^(APF|APS)-\d{8,18}$/.test(label)) throw new Error('invalid_label');
  return bwipjs.toSVG({bcid:'code128',text:label,scale:2,height:12,paddingwidth:10,includetext:true,textxalign:'center',backgroundcolor:'FFFFFF'});
};
export const getPrintableStock = async (access:OperationsAccess, ids:string[]) => {
  if(!access.owner) throw new Error('owner_required');
  const result=await query(`SELECT i.id,i.sku,p.title,l.label_number FROM ops_item_labels l
    JOIN inventory_skus i ON i.id=l.inventory_id JOIN products p ON p.id=i.product_id WHERE i.id=ANY($1::uuid[]) ORDER BY l.label_number`,[ids]);
  return result.rows.map(row=>({id:String(row.id),label:`APS-${String(row.label_number).padStart(8,'0')}`,title:String(row.title),sku:String(row.sku),color:'',storage:''}));
};
export const getPrintableAssets = async (access:OperationsAccess, ids:string[]) => {
  if(!access.owner) throw new Error('owner_required');
  const result=await query(`SELECT a.id,a.label_number,a.color,a.storage,p.title,i.sku FROM ops_assets a
    JOIN inventory_skus i ON i.id=a.inventory_id JOIN products p ON p.id=i.product_id WHERE a.id=ANY($1::uuid[]) ORDER BY a.label_number`,[ids]);
  return result.rows.map(row=>({id:String(row.id),label:assetLabel(row.label_number),title:String(row.title),sku:String(row.sku),color:String(row.color),storage:String(row.storage)}));
};
export const readTrainingDocument = async (access:OperationsAccess, documentId:string) => {
  const result=await query(`SELECT * FROM ops_documents WHERE id=$1 AND kind='training_sale'
    AND ($2::boolean OR (branch_id=$3 AND actor_id=$4))`,[documentId,access.owner,access.branchId,access.userId]);
  return result.rows[0] ?? null;
};
export const renderTrainingReceipt = async (document:Record<string,unknown>):Promise<Buffer> => {
  const payload=document.payload as {lines:TillLine[];totalCents:number;branchName:string};
  if(!Array.isArray(payload.lines) || !payload.lines.length || payload.lines.some(line=>line.unitCents*line.quantity!==line.totalCents)
    || payload.lines.reduce((sum,line)=>sum+line.totalCents,0)!==payload.totalCents) throw new Error('document_integrity_failed');
  const regular=path.join(process.cwd(),'public/fonts/NotoSans-Regular.ttf');
  const bold=path.join(process.cwd(),'public/fonts/NotoSans-Bold.ttf');
  const money=(value:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(value/100);
  return new Promise((resolve,reject)=>{
    const chunks:Buffer[]=[];
    const pdf=new PDFDocument({size:'A4',margin:42,font:regular,info:{Title:'Apfel Park Übungsbeleg',Author:businessIdentity.tradingName}});
    pdf.on('data',(chunk:Buffer)=>chunks.push(chunk));pdf.on('error',reject);pdf.on('end',()=>resolve(Buffer.concat(chunks)));
    pdf.registerFont('body',regular).registerFont('bold',bold);
    const header=()=>{
      pdf.font('bold').fontSize(18).fillColor('#b88721').text('APFEL PARK');
      pdf.font('body').fontSize(9).fillColor('#333333').text(businessAddress('de'));
      pdf.moveDown().font('bold').fontSize(14).text('ÜBUNGSBELEG - KEIN VERKAUF');
      pdf.font('body').fontSize(9).text('Keine Zahlung angenommen. Kein steuerlicher Beleg. Kein Warenabgang.');
      pdf.moveDown().text(`ÜBUNG-${document.number} · ${payload.branchName}`);
      pdf.text(new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',dateStyle:'long',timeStyle:'short'}).format(new Date(String(document.created_at))));
      pdf.moveDown();
    };
    header();
    for(const line of payload.lines) {
      if(pdf.y>700) {pdf.addPage();header();}
      pdf.font('bold').fontSize(10).text(line.title);
      pdf.font('body').fontSize(8).fillColor('#777777').text(`${line.sku} · ${line.condition}`);
      pdf.fontSize(10).fillColor('#333333').text(`${line.quantity} × ${money(line.unitCents)} = ${money(line.totalCents)}`);pdf.moveDown();
    }
    if(pdf.y>690) {pdf.addPage();header();}
    pdf.moveDown().font('bold').fontSize(16).text(`Übungssumme: ${money(payload.totalCents)}`);
    pdf.moveDown().font('body').fontSize(9).text('Dieser Beleg dient ausschließlich zur Prüfung des Kassenablaufs.');
    pdf.end();
  });
};
