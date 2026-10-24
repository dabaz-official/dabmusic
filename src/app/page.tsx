import { getAlbums } from "@/lib/library";

export default function Home() {
  const albums = getAlbums();
  return (
    <main>
      <div>{albums.length} albums in the library</div>
    </main>
  );
}
