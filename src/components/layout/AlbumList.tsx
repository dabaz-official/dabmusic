import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';

import { ExplicitIcon } from '@/components/icon/PlayerIcon';
import { Album } from '@/lib/albums';

interface AlbumListProps {
  albums: Album[];
}

export default function AlbumList({ albums }: AlbumListProps) {
  return (
    <div className="mt-6 grid gap-x-6 gap-y-10 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:gap-x-8">
      {albums.map((album, index) => (
        <motion.div
          key={index}
          className="group relative"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
        >
          <Link href={`/album/${album.id}`} className="block">
            <Image
              src={album.cover}
              alt={album.title}
              height={400}
              width={400}
              className="aspect-square w-full rounded-xl bg-neutral-200 object-cover group-hover:opacity-90 transition-all duration-300 cursor-pointer"
            />
          </Link>
          <div className="mt-2 flex justify-between">
            <div>
              <h3 className="text-md font-bold text-neutral-900 flex items-center space-x-1">
                <Link href={`/album/${album.id}`} className="hover:underline">
                  <span aria-hidden="true" className="absolute inset-0" />
                  {album.title}
                </Link>
                <span className="text-neutral-500 text-sm">{album.isExplicit && <ExplicitIcon className="h-4 w-4" />}</span>
              </h3>
              <p className="text-sm text-neutral-500">{album.artist}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
