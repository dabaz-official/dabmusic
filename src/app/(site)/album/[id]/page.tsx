import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ExplicitBadge } from "@/components/explicit-badge";
import { AlbumActions } from "@/components/player/album-actions";
import { TrackList } from "@/components/player/track-list";
import { stepDown } from "@/lib/color";
import { formatTime } from "@/lib/format";
import { getAlbums } from "@/lib/library";
import type { Album } from "@/lib/types";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const albums = await getAlbums();
  return albums.map((album) => ({ id: album.id }));
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { id } = await params;
  const album = (await getAlbums()).find((candidate) => candidate.id === id);
  if (!album) return {};

  const trackCount = `${album.tracks.length} track${album.tracks.length === 1 ? "" : "s"}`;
  // The cover is the preview, at its own resolution (1000–1024px square):
  // no composed card, so a link to an album looks like the album.
  const cover = {
    url: album.cover,
    alt: `${album.title} cover`,
  };

  return {
    title: album.title,
    description: `${album.artist} — ${trackCount}`,
    alternates: { canonical: `/album/${album.id}` },
    openGraph: {
      type: "music.album",
      title: album.title,
      description: `${album.artist} — ${trackCount}`,
      url: `/album/${album.id}`,
      images: [cover],
    },
    twitter: {
      card: "summary",
      title: album.title,
      description: `${album.artist} — ${trackCount}`,
      images: [album.cover],
    },
  };
}

/**
 * `params` resolves inside Suspense because Partial Prefetching serves the
 * shell before the route target is known (see the Cache Components guide).
 */
export default function AlbumPage({ params }: AlbumPageProps) {
  return (
    <Suspense fallback={<AlbumSkeleton />}>
      <AlbumDetail params={params} />
    </Suspense>
  );
}

function AlbumSkeleton() {
  return (
    <div className="dz-container">
      <div className="flex flex-col items-center lg:grid lg:grid-cols-[270px_minmax(0,1fr)] lg:items-stretch lg:gap-x-[34px]">
        <div className="aspect-square w-[270px] max-w-full shrink-0 rounded-[7px] bg-surface-secondary" />
        <div className="mt-[18px] flex w-full flex-col items-center gap-2 lg:mt-0 lg:items-start">
          <div className="h-[26px] w-2/3 rounded-sm bg-surface-secondary lg:h-[30px]" />
          <div className="h-[24px] w-1/3 rounded-sm bg-surface-secondary lg:h-[30px]" />
        </div>
      </div>
    </div>
  );
}

/** The one line of metadata Apple puts under the artist line. */
function albumMeta(album: Album, totalSeconds: number) {
  const year = album.releaseDate?.slice(0, 4);
  const tracks = `${album.tracks.length} track${album.tracks.length === 1 ? "" : "s"}`;
  return [year, tracks, totalSeconds > 0 ? formatTime(totalSeconds) : null]
    .filter(Boolean)
    .join(" · ");
}

async function AlbumDetail({ params }: AlbumPageProps) {
  const { id } = await params;
  const album = (await getAlbums()).find((candidate) => candidate.id === id);
  if (!album) notFound();

  const totalSeconds = album.tracks.reduce((sum, song) => sum + song.duration, 0);

  const tint = album.tint;
  const tintVars = tint
    ? ({ "--album-tint": tint.color } as React.CSSProperties)
    : undefined;

  // The artist page only exists for the catalogue's own artist; everywhere
  // else the line is plain text, exactly as Apple leaves an unlinked name.
  const artistHref = album.artist === "DabAZ" ? "/dabaz" : null;

  return (
    <div
      // The album's colour decides the page's polarity, not the site theme: a
      // pale tint gives a light page and a deep one a dark page, in both
      // appearances — the same call Apple makes with the `--dark-layout`
      // header and their `-onDark` tokens. `AlbumFooterTint` carries the same
      // mode to the chrome.
      className={tint?.mode}
      style={tintVars}
      // Apple paints the footer band as this page's tint stepped down by 10
      // per channel, and the footer lives outside this page (it belongs to the
      // site layout). `AlbumFooterTint` reads this off the *visible* page and
      // publishes it on :root; see that component for why it has to be the
      // visible one.
      data-footer={tint ? stepDown(tint.color) : undefined}
      data-mode={tint?.mode}
    >
      {/* Whole-page tint (Apple's album page): the cover's own colour, flat
          and full-viewport, so it also sits behind the translucent sidebar.
          Standard text tokens paint on top, so contrast is untouched. */}
      {tint && (
        <div
          aria-hidden="true"
          className="fixed inset-0 -z-10 bg-(--album-tint)"
        />
      )}
      <div className="dz-container pb-16">
        {/* Apple's album header: the 270px cover on the left, its headings
            centred against it and the transport on the cover's bottom line.
            Below 1024px the whole block stacks and centres instead. */}
        <header className="flex flex-col items-center lg:grid lg:grid-cols-[270px_minmax(0,1fr)] lg:items-stretch lg:gap-x-[34px]">
          {/* Same 7px corner as the album cards on the home page, with a
              hairline rim so the art still reads as a surface on the tinted
              page. */}
          <Image
            src={album.cover}
            alt={`${album.title} cover`}
            width={270}
            height={270}
            priority
            className="aspect-square w-[270px] max-w-full shrink-0 rounded-[7px] object-cover outline-1 -outline-offset-1 outline-(--dz-hairline)"
          />
          <div className="flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mt-[18px] flex min-w-0 flex-col items-center lg:mt-0 lg:flex-1 lg:items-start lg:justify-center">
              <h1 className="flex items-center gap-[6.5px] text-[22px] font-bold leading-[26px] text-(--dz-text-label) lg:text-[26px] lg:leading-[30px]">
                <span>{album.title}</span>
                {album.explicit && (
                  <ExplicitBadge className="h-4 w-4 lg:h-[19px] lg:w-[19px]" />
                )}
              </h1>
              <p className="text-[20px] leading-6 text-(--dz-text-label) lg:text-[26px] lg:leading-[30px]">
                {artistHref ? (
                  <Link href={artistHref} className="hover:underline">
                    {album.artist}
                  </Link>
                ) : (
                  album.artist
                )}
              </p>
              <p className="mt-1 text-[12px] font-semibold leading-[15px] text-(--dz-text-muted)">
                {albumMeta(album, totalSeconds)}
              </p>
            </div>
            <div className="mt-3.5 lg:mt-0 lg:self-start">
              <AlbumActions album={album} />
            </div>
          </div>
        </header>

        <div className="mt-8 lg:mt-10">
          <TrackList album={album} />
        </div>
      </div>
    </div>
  );
}
