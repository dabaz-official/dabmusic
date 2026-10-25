import { getAlbums } from "@/lib/library";

export default function Home() {
  const albums = getAlbums();
  return (
    <div className="dz-container">
      <div>{albums.length} albums in the library</div>
    </div>
  );
}
