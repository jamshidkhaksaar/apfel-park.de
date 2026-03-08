'use server';

import { revalidatePath } from 'next/cache';

import { createAdminClient } from '@/lib/supabase/admin';
import { isAdminUser } from '@/lib/admin-auth';
import { createClient } from '@/lib/supabase/server';
import type { ContactContent } from './page';

type Result = { success: boolean; message: string };

export async function saveContent(content: ContactContent): Promise<Result> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !isAdminUser(user)) {
      return { success: false, message: 'Unauthorized' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from('store_settings')
      .upsert(
        { key: 'content_contact', value: content, updated_at: new Date().toISOString() },
        { onConflict: 'key' },
      );

    if (error) {
      console.error('Error saving contact content:', error);
      return { success: false, message: 'Failed to save content.' };
    }

    revalidatePath('/[lang]/contact', 'page');
    return { success: true, message: 'Content saved successfully!' };
  } catch (err) {
    console.error('Error saving contact content:', err);
    return { success: false, message: 'Failed to save content.' };
  }
}
