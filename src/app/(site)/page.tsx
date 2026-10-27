import Image from "next/image";
import Link from "next/link";

import { ExplicitBadge } from "@/components/explicit-badge";
import { PlaySongsButton } from "@/components/player/play-songs-button";
import { getAlbums } from "@/lib/library";
import type { Album } from "@/lib/types";

export default async function Home() {
  const albums = await getAlbums();
  const unreleased = albums.filter((album) => album.section === "unreleased");
  const released = albums.filter((album) => album.section === "released");

  return (
    <div className="dz-container">
      {/* -mt-[8px]: the 36px/44px line box puts the cap glyphs 8px below the
          box top; this pulls the "H" optically level with the sidebar logo's
          top. */}
      <h1 className="-mt-[8px] text-[36px] font-semibold leading-11 text-text-primary">
        Home
      </h1>

      <section>
        <h2 className="mt-8 text-lg font-semibold text-text-primary">
          Unreleased
        </h2>
        <AlbumGrid albums={unreleased} className="mt-2" />
      </section>

      <section>
        <h2 className="mt-12 text-lg font-semibold text-text-primary">
          Released
        </h2>
        <AlbumGrid albums={released} className="mt-2" />
      </section>
    </div>
  );
}

function AlbumGrid({ albums, className }: { albums: Album[]; className?: string }) {
  return (
    <div
      className={`grid grid-cols-2 gap-6 min-[720px]:grid-cols-3 min-[890px]:grid-cols-4 min-[1260px]:grid-cols-5 min-[1600px]:grid-cols-6 ${className ?? ""}`}
    >
      {albums.map((album) => (
        <section key={album.id} className="group">
          <div className="relative">
            <Link href={`/album/${album.id}`} aria-label={album.title}>
              <Image
                src={album.cover}
                alt={`${album.title} cover`}
                width={280}
                height={280}
                className="aspect-square w-full rounded-md object-cover"
                sizes="(min-width: 1600px) 180px, (min-width: 1260px) 155px, (min-width: 890px) 105px, (min-width: 720px) 98px, 45vw"
              />
            </Link>
            <PlaySongsButton songs={album.tracks} album={album} />
          </div>
          <Link href={`/album/${album.id}`}>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="min-w-0 flex-1 truncate text-xs font-normal text-text-primary">
                {album.title}
              </span>
              {/* 9px = the rendered cap height of the 12px regular title. */}
              {album.explicit && <ExplicitBadge className="h-[9px] w-[9px]" />}
            </div>
            <div className="truncate text-xs text-text-secondary">
              {album.artist}
            </div>
          </Link>
        </section>
      ))}
    </div>
  );
}
