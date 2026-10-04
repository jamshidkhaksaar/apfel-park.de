import { describe,it,expect } from 'vitest';
import { assetLabel,assertCashierPayload,isSensitiveSearchInput,moneyCents,wholeQuantity } from './types';
import { assertOperationsBranch,requireOperationsOwner } from './access';
import { reportDates } from './read';

describe('operations money and permissions',()=>{
  it.each([['259',25900],['259,90',25990],['0.01',1],['1129.99',112999]])('parses %s without losing cents',(input,expected)=>expect(moneyCents(input)).toBe(expected));
  it.each(['-1','1.001','NaN','Infinity','1e3',''])('rejects ambiguous amounts %s',input=>expect(()=>moneyCents(input)).toThrow());
  it.each([0,-1,1.5,1001])('rejects invalid quantities %s',input=>expect(()=>wholeQuantity(input)).toThrow());
  it('uses a distinct internal asset barcode',()=>expect(assetLabel(24)).toBe('APF-00000024'));
  it('keeps full IMEI/EID scans out of URL-based product searches',()=>{
    expect(isSensitiveSearchInput('123456789012345')).toBe(true);
    expect(isSensitiveSearchInput('IMEI:123456789012345')).toBe(true);
    expect(isSensitiveSearchInput('APF-00000024')).toBe(false);
    expect(isSensitiveSearchInput('4006381333931')).toBe(false);
  });
  it('rejects a cashier price override at both levels',()=>{
    expect(()=>assertCashierPayload({action:'training_sale',items:[{inventoryId:'x',quantity:1,unitCents:1}]})).toThrow('price_override_forbidden');
    expect(()=>assertCashierPayload({action:'training_sale',items:[{inventoryId:'x',quantity:1}],discount:10})).toThrow('price_override_forbidden');
  });
  it('checks branch scope and owner writes',()=>{
    const cashier={userId:'test',email:'test@example.invalid',owner:false,branchId:'main'};
    expect(()=>assertOperationsBranch(cashier,'second')).toThrow('branch_forbidden');
    expect(()=>requireOperationsOwner(cashier)).toThrow('owner_required');
    expect(()=>assertOperationsBranch(cashier,'main')).not.toThrow();
  });
  it('rejects invalid dates and excessive report windows',()=>{
    expect(()=>reportDates('2026-02-30','2026-03-01')).toThrow('invalid_dates');
    expect(()=>reportDates('2024-01-01','2026-01-01')).toThrow('invalid_dates');
    expect(reportDates('2026-01-01','2026-02-01').from).toBe('2026-01-01');
  });
});
