import type { MetadataRoute } from "next";

import { getAlbums } from "@/lib/library";
import { SITE_URL } from "@/lib/site";

/**
 * Every route the site actually has: home, the artist page, and one entry per
 * album. Albums carry their release date as `lastModified`, so a crawler can
 * tell when a page's content last changed without guessing.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const albums = await getAlbums();

  return [
    {
      url: `${SITE_URL}/`,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/dabaz`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...albums.map((album) => ({
      url: `${SITE_URL}/album/${album.id}`,
      lastModified: album.releaseDate,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
}
