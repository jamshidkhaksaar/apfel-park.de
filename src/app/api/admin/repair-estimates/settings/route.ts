import { NextRequest, NextResponse } from 'next/server';

import { createAdminDbClient } from '@/lib/admin-db';
import { requireRepairEstimateUser } from '@/lib/repair-estimate-auth';
import { rejectCrossSiteAdminMutation } from '@/lib/admin-csrf';
import { getEstimateTemplateSettings } from '@/lib/repair-estimate-settings';
import {
  isValidBic,
  isValidIban,
  normalizeTemplateSettings,
} from '@/lib/repair-estimates';

export async function GET() {
  const auth = await requireRepairEstimateUser();
  if (auth.response) return auth.response;
  return NextResponse.json({ settings: await getEstimateTemplateSettings() });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireRepairEstimateUser();
  if (auth.response) return auth.response;
  const csrf = rejectCrossSiteAdminMutation(request);
  if (csrf) return csrf;
  try {
    const settings = normalizeTemplateSettings(await request.json());
    if (!settings.issuerText || !settings.accountHolder || !isValidIban(settings.iban) || !isValidBic(settings.bic)) {
      return NextResponse.json({ error: 'Complete the issuer, account holder, IBAN, and BIC first.' }, { status: 400 });
    }
    const admin = createAdminDbClient();
    const { error } = await admin.from('store_settings').upsert({
      key: 'repair_estimate_template',
      value: settings,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) throw new Error(error.message);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('[Repair estimates] settings save failed', error);
    return NextResponse.json({ error: 'Failed to save template settings' }, { status: 500 });
  }
}
