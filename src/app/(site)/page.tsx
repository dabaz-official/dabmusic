import { AlbumGrid } from "@/components/album-grid";
import { getAlbums } from "@/lib/library";

export default async function Home() {
  const albums = await getAlbums();
  const unreleased = albums.filter((album) => album.section === "unreleased");
  const released = albums.filter((album) => album.section === "released");

  return (
    <div className="dz-container">
      {/* 34/40 bold, Apple's page-title metrics. -mt-[6.5px] cancels the line
          box's half-leading so the "H" *glyph* top — not the box top — sits on
          the same 32px line as the sidebar logo's mark. */}
      <h1 className="-mt-[6.5px] text-[34px] font-bold leading-10 text-(--dz-text-label)">
        Home
      </h1>

      <section>
        <h2 className="mt-8 text-[17px] font-bold leading-[22px] text-(--dz-text-label)">
          Unreleased
        </h2>
        <AlbumGrid albums={unreleased} className="mt-[13px]" />
      </section>

      <section>
        <h2 className="mt-11 text-[17px] font-bold leading-[22px] text-(--dz-text-label)">
          Released
        </h2>
        <AlbumGrid albums={released} className="mt-[13px]" />
      </section>
    </div>
  );
}
