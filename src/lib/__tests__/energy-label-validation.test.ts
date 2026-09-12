import { describe, expect, it } from 'vitest';
import { energyLabelError, validEnergyEndurance } from '../energy-label-validation';
import { buildPayload, getMessages, validatePayload } from '../product-write-payload';
import { evaluateProductChannelReadiness } from '../product-channel-readiness';

describe('energy-label input validation', () => {
  it.each(['47 h 0 min', '47h', '47:30', '47 Std. 30 min', '47,5 hours', '2820 min'])('accepts duration %s', value => expect(validEnergyEndurance(value)).toBe(true));
  it.each(['A', '4500 mAh', 'Bis zu 17 Stunden Videowiedergabe', '0 h', '-3 h', '47 h 99 min', 'Infinity h'])('rejects non-label duration %s', value => expect(validEnergyEndurance(value)).toBe(false));
  it('allows incomplete drafts but requires a registration before publishing claims', () => {
    expect(energyLabelError({}, null, true)).toBeNull();
    expect(energyLabelError({ efficiencyClass: 'A' }, null, false)).toBeNull();
    expect(energyLabelError({ efficiencyClass: 'A' }, null, true)).toBe('reference');
    expect(energyLabelError({ ipRating: 'IP68' }, null, true)).toBeNull();
  });
  it('checks classes, raw cycle counts and EPREL identifiers without rounding bad values away', () => {
    expect(energyLabelError({ efficiencyClass:' a ', repairabilityClass:'C', reliabilityClass:'B', batteryCycles:1000, batteryEndurance:'47 h 0 min' }, '2402615', true)).toBeNull();
    for (const input of [{ efficiencyClass:'H' }, { repairabilityClass:'G' }, { batteryCycles:0 }, { batteryCycles:-1 }, { batteryCycles:1.5 }, { batteryCycles:Infinity }, { ipRating:'IP88' }]) expect(energyLabelError(input, '2402615')).toBe('format');
    expect(energyLabelError({}, 'A2633')).toBe('format');
    expect(energyLabelError({}, 2402615)).toBe('format');
  });
  it('rejects malformed labels through the shared admin payload boundary', () => {
    const base = { title:'Test', category:'smartphones', price:100, stock:1, condition:'new' };
    const invalid = buildPayload({ ...base, energyLabel:{batteryEndurance:'A'} });
    expect(validatePayload(invalid, getMessages(true))).toBe(getMessages(true).energyFormatInvalid);
    expect(validatePayload(buildPayload({ ...base, energyLabel:{batteryCycles:1.5} }), getMessages(false))).toBe(getMessages(false).energyFormatInvalid);
    expect(validatePayload(buildPayload({ ...base, isActive:true, energyLabel:{efficiencyClass:'A'} }), getMessages(true))).toBe(getMessages(true).energyReferenceRequired);
    expect(validatePayload(buildPayload({ ...base, isActive:false, energyLabel:{efficiencyClass:'A'} }), getMessages(true))).toBeNull();
  });
  it('keeps malformed energy claims out of channel readiness', () => {
    const result = evaluateProductChannelReadiness({ title:'Test', energyLabel:{batteryEndurance:'4500 mAh'} });
    expect(result.google.errors.join(' ')).toContain('Correct invalid energy-label values');
  });
});
