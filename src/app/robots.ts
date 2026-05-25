import type { MetadataRoute } from "next";

import { getRobotsConfig } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  return getRobotsConfig();
}
