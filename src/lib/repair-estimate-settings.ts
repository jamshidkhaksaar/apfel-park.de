import 'server-only';

import { createAdminDbClient } from '@/lib/admin-db';
import {
  normalizeTemplateSettings,
  type RepairEstimateTemplateSettings,
} from '@/lib/repair-estimates';

export const getEstimateTemplateSettings = async (): Promise<RepairEstimateTemplateSettings> => {
  const admin = createAdminDbClient();
  const { data } = await admin.from('store_settings').select('value').eq('key', 'repair_estimate_template').maybeSingle();
  return normalizeTemplateSettings(data?.value);
};
