import Image from 'next/image';

import { Song } from '@/lib/songs';

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
            className="aspect-square w-full rounded-2xl bg-gray-200 object-cover group-hover:opacity-75"
          />
          <div className="mt-4 flex justify-between">
            <div>
              <h3 className="text-sm text-neutral-700">
                <button onClick={() => onSongSelect(index)}>
                  <span aria-hidden="true" className="absolute inset-0" />
                  {song.title}
                </button>
              </h3>
              <p className="mt-1 text-sm text-gray-500">{song.artist}</p>
            </div>
            <span className="text-gray-500 text-sm">{song.isExplicit && <span className="text-red-500 font-bold">E</span>}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
