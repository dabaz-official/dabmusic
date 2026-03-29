import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { albums } from '@/lib/albums';
import AlbumClient from './AlbumClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const album = albums.find((a) => a.id === id);

  if (!album) {
    return {
      title: 'Album Not Found',
    };
  }

  return {
    title: album.title,
    description: album.artist,
    openGraph: {
      title: album.title,
      description: album.artist,
      images: [
        {
          url: album.cover,
          width: 800,
          height: 800,
          alt: album.title,
        },
      ],
    },
  };
}

export default async function AlbumPage({ params }: PageProps) {
  const { id } = await params;
  const album = albums.find((a) => a.id === id);

  if (!album) {
    return notFound();
  }

  return <AlbumClient album={album} />;
}
