import {beforeEach,describe,expect,it} from 'vitest';
import {canonicalOperation,operationBody,readOperationPreview,signOperationPreview} from './preview';
import {previousReportDates} from './report';

beforeEach(()=>{process.env.APP_SESSION_SECRET='unit-test-operations-preview-secret';});
describe('operations pilot confirmations',()=>{
  const claims={v:1 as const,actor:'owner',hash:'body-hash',state:'snapshot-hash',expires:1791320000000};
  it('roundtrips domain-separated signed claims without private values',()=>expect(readOperationPreview(signOperationPreview(claims))).toEqual(claims));
  it('rejects altered claims, signatures and extra token segments',()=>{
    const token=signOperationPreview(claims);expect(()=>readOperationPreview(token+'x')).toThrow('invalid_confirmation');
    expect(()=>readOperationPreview(token+'.more')).toThrow('invalid_confirmation');
    expect(()=>readOperationPreview(undefined)).toThrow('confirmation_required');
  });
  it('preserves timestamp revisions when canonicalizing snapshots',()=>{
    expect(canonicalOperation({b:2,a:new Date('2026-10-06T10:00:00Z')})).toEqual({a:'2026-10-06T10:00:00.000Z',b:2});
  });
  it('hashes business requests independently of the confirmation envelope',()=>expect(operationBody({action:'purchase',previewToken:'secret',idempotencyKey:'same'})).toEqual({action:'purchase',idempotencyKey:'same'}));
  it('compares the immediately preceding equal-length period',()=>expect(previousReportDates('2026-10-01','2026-10-06')).toEqual({from:'2026-09-25',to:'2026-09-30'}));
});
