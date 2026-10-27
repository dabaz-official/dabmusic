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
      {/* 34/40 bold, Apple's page-title metrics; -mt-[6.5px] cancels the
          line box's half-leading so the "H" cap top sits level with the
          sidebar logo. */}
      <h1 className="-mt-[6.5px] text-[34px] font-bold leading-10 text-(--dz-text-label)">
        Home
      </h1>

      <section>
        <h2 className="mt-8 text-[17px] font-bold leading-[22px] text-(--dz-text-label)">
          Unreleased
        </h2>
        <AlbumGrid albums={unreleased} className="mt-2" />
      </section>

      <section>
        <h2 className="mt-12 text-[17px] font-bold leading-[22px] text-(--dz-text-label)">
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
      className={`dz-shelf ${className ?? ""}`}
    >
      {albums.map((album) => (
        <section key={album.id} className="dz-shelf-item group">
          <div className="relative">
            <Link href={`/album/${album.id}`} aria-label={album.title}>
              <Image
                src={album.cover}
                alt={`${album.title} cover`}
                width={280}
                height={280}
                className="aspect-square w-full rounded-[7px] object-cover"
                sizes="(min-width: 1600px) 180px, (min-width: 1260px) 155px, (min-width: 890px) 105px, (min-width: 720px) 98px, 45vw"
              />
            </Link>
            <PlaySongsButton songs={album.tracks} album={album} />
          </div>
          <Link href={`/album/${album.id}`}>
            <div className="mt-[5px] flex items-baseline gap-1.5">
              <span className="min-w-0 flex-1 truncate text-xs font-normal leading-[15px] text-(--dz-text-label)">
                {album.title}
              </span>
              {/* 10px, matching Apple's explicit glyph box. */}
              {album.explicit && <ExplicitBadge className="h-[10px] w-[10px]" />}
            </div>
            <div className="truncate text-xs leading-[15px] text-(--dz-text-muted)">
              {album.artist}
            </div>
          </Link>
        </section>
      ))}
    </div>
  );
}
