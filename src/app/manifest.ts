import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DabMusic',
    short_name: 'DabMusic',
    description: 'I AM MUSIC.',
    start_url: '/',
    display: 'standalone',
    background_color: '#000',
    theme_color: '#fff',
    icons: [
      {
        src: '/icons/apple-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/apple-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}