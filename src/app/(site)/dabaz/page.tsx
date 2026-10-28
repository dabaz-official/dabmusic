import type { Metadata } from "next";

import { AlbumGrid } from "@/components/album-grid";
import { getAlbums } from "@/lib/library";

export const metadata: Metadata = {
  title: "DabAZ",
};

export default async function DabAZPage() {
  const albums = (await getAlbums()).filter(
    (album) => album.artist === "DabAZ",
  );
  const unreleased = albums.filter((album) => album.section === "unreleased");
  const released = albums.filter((album) => album.section === "released");

  return (
    <div className="dz-container">
      {/* Same metrics and the same optical pull as the home title, so both
          headings sit on the logo's 32px line. */}
      <h1 className="-mt-[6.5px] text-[34px] font-bold leading-10 text-(--dz-text-label)">
        DabAZ
      </h1>

      {unreleased.length > 0 && (
        <section>
          <h2 className="mt-8 text-[17px] font-bold leading-[22px] text-(--dz-text-label)">
            Unreleased
          </h2>
          <AlbumGrid albums={unreleased} className="mt-[13px]" />
        </section>
      )}

      {released.length > 0 && (
        <section>
          <h2 className="mt-11 text-[17px] font-bold leading-[22px] text-(--dz-text-label)">
            Released
          </h2>
          <AlbumGrid albums={released} className="mt-[13px]" />
        </section>
      )}
    </div>
  );
}
