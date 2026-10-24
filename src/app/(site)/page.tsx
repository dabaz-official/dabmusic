import Image from "next/image";
import Link from "next/link";

import { ExplicitBadge } from "@/components/explicit-badge";
import { PlaySongsButton } from "@/components/player/play-songs-button";
import { getAlbums } from "@/lib/library";

export default async function Home() {
  const albums = await getAlbums();

  return (
    <div className="dz-container">
      <h1 className="sr-only">Library</h1>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {albums.map((album) => (
          <section key={album.id} className="group">
            <div className="relative">
              <Link
                href={`/album/${album.id}`}
                aria-label={album.title}
                className="block"
              >
                <Image
                  src={album.cover}
                  alt={`${album.title} cover`}
                  width={280}
                  height={280}
                  className="aspect-square w-full rounded-lg object-cover"
                  sizes="(min-width: 1024px) 260px, (min-width: 640px) 40vw, 45vw"
                />
              </Link>
              <PlaySongsButton songs={album.tracks} />
            </div>
            <Link href={`/album/${album.id}`} className="mt-3 block">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-base font-medium text-text-primary">
                  {album.title}
                </span>
                {album.explicit && <ExplicitBadge />}
              </div>
              <div className="mt-0.5 truncate text-sm text-text-secondary">
                {album.artist}
              </div>
            </Link>
          </section>
        ))}
      </div>
    </div>
  );
}
