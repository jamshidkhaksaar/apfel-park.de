import AdminShell from "../../../components/admin/AdminShell";
import { getAdminDictionary } from "@/lib/admin-i18n-server";
import { getHeroMediaSettings } from "@/lib/site-settings-server";

import HeroMediaForm from "./HeroMediaForm";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const dict = await getAdminDictionary();
  const media = await getHeroMediaSettings();

  return (
    <AdminShell title={dict.mediaPage.title}>
      <HeroMediaForm
        initialState={{
          enabled: media.enabled,
          sourceType: media.sourceType,
          videoUrl: media.videoUrl,
          posterUrl: media.posterUrl,
          mobileImages: media.mobileImages,
          fallbackImageUrl: media.fallbackImageUrl,
          title: media.title,
          subtitle: media.subtitle,
        }}
      />
    </AdminShell>
  );
}
