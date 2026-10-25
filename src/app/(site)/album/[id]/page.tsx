import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ExplicitBadge } from "@/components/explicit-badge";
import { PlaySongsButton } from "@/components/player/play-songs-button";
import { TrackList } from "@/components/player/track-list";
import { getAlbums } from "@/lib/library";

interface AlbumPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAlbums().map((album) => ({ id: album.id }));
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { id } = await params;
  const album = getAlbums().find((candidate) => candidate.id === id);
  if (!album) return {};

  return {
    title: album.title,
    description: `${album.artist} — ${album.tracks.length} track${album.tracks.length === 1 ? "" : "s"}`,
    openGraph: {
      title: album.title,
      description: album.artist,
      images: [{ url: album.cover }],
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
    <div className="dz-container animate-pulse">
      <div className="flex flex-wrap items-end gap-8">
        <div className="h-[232px] w-[232px] rounded-lg bg-surface-secondary" />
        <div className="flex-1 space-y-4">
          <div className="h-10 w-2/3 rounded-md bg-surface-secondary" />
          <div className="h-5 w-1/3 rounded-md bg-surface-secondary" />
        </div>
      </div>
    </div>
  );
}

async function AlbumDetail({ params }: AlbumPageProps) {
  const { id } = await params;
  const album = getAlbums().find((candidate) => candidate.id === id);
  if (!album) notFound();

  return (
    <div className="dz-container">
      <header className="flex flex-wrap items-end gap-8">
        <Image
          src={album.cover}
          alt={`${album.title} cover`}
          width={232}
          height={232}
          priority
          className="h-[232px] w-[232px] rounded-lg object-cover shadow-xl"
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-normal uppercase tracking-wide text-text-tertiary">
            Album
          </div>
          <h1 className="mt-2 flex items-center gap-2 text-4xl font-semibold text-text-primary">
            <span className="truncate">{album.title}</span>
            {album.explicit && <ExplicitBadge />}
          </h1>
          <p className="mt-3 text-base text-text-secondary">
            <span className="font-normal text-text-primary">{album.artist}</span>
            {" — "}
            {album.tracks.length} track{album.tracks.length === 1 ? "" : "s"}
          </p>
        </div>
        <PlaySongsButton songs={album.tracks} album={album} variant="pill" />
      </header>

      <div className="mt-8">
        <TrackList album={album} />
      </div>
    </div>
  );
}
