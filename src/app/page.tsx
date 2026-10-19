import AlbumList from '@/components/layout/AlbumList';
import { albums } from '@/lib/albums';

export default function Home() {
  return (
    <div className="container mx-auto px-6">
      <AlbumList albums={albums} />
    </div>
  );
}
