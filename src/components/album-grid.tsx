import Image from "next/image";
import Link from "next/link";

import { AlbumShelf } from "@/components/album-shelf";
import { ExplicitBadge } from "@/components/explicit-badge";
import { PlaySongsButton } from "@/components/player/play-songs-button";
import type { Album } from "@/lib/types";

/**
 * One row of album cards on a scrolling shelf. Shared by the home page and the
 * artist page so the card treatment stays identical.
 */
export function AlbumGrid({
  albums,
  className,
}: {
  albums: Album[];
  className?: string;
}) {
  return (
    <AlbumShelf className={className}>
      {albums.map((album) => (
        <section key={album.id} className="dz-shelf-item">
          {/* `group` on the artwork only — moving onto the title or artist
              below must hide the play button. */}
          <div className="group relative">
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
    </AlbumShelf>
  );
}
