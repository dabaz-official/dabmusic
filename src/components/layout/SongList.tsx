import Image from 'next/image';

import { Song } from '@/lib/songs';
import { ExplicitIcon } from '@/components/icon/PlayerIcon';

interface SongListProps {
  songs: Song[];
  onSongSelect: (index: number) => void;
}

export default function SongList({ songs, onSongSelect }: SongListProps) {
  return (
    <div className="mt-6 grid gap-x-6 gap-y-10 grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
      {songs.map((song, index) => (
        <div key={index} className="group relative">
          <Image
            src={song.cover}
            alt={song.title}
            height={400}
            width={400}
            className="aspect-square w-full rounded-3xl bg-neutral-200 object-cover group-hover:opacity-75"
          />
          <div className="mt-2 flex justify-between">
            <div>
              <h3 className="text-md font-bold text-neutral-900 flex items-center space-x-1">
                <button onClick={() => onSongSelect(index)}>
                  <span aria-hidden="true" className="absolute inset-0" />
                  {song.title}
                </button>
                <span className="text-neutral-500 text-sm">{song.isExplicit && <ExplicitIcon className="h-4 w-4" />}</span>
              </h3>
              <p className="text-sm text-neutral-500">{song.artist}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
