import { getAlbums } from "@/lib/library";

export default function Home() {
  const albums = getAlbums();
  return (
    <div className="dz-container py-8">
      <div>{albums.length} albums in the library</div>
    </div>
  );
}
