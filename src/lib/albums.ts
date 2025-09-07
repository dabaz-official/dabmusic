export interface Song {
  title: string;
  src: string;
  cover: string;
  artist: string;
  isExplicit: boolean;
}

export interface Album {
  id: string;
  title: string;
  cover: string;
  artist: string;
  isExplicit: boolean;
  releaseDate?: string;
  songs: Song[];
}

export const albums: Album[] = [
  {
    id: 'that-boy-is-handsome-af',
    title: '那小子真帅',
    cover: '/images/na-xiao-zi-zhen-shuai.webp',
    artist: 'SASIOVERLXRD',
    isExplicit: true,
    releaseDate: '2024-03-29',
    songs: [
      {
        title: '可惜你不在',
        src: '/audio/ke-xi-ni-bu-zai.mp3',
        cover: '/images/na-xiao-zi-zhen-shuai.webp',
        artist: 'SASIOVERLXRD',
        isExplicit: true,
      },
      {
        title: '下坡',
        src: '/audio/xia-po.mp3',
        cover: '/images/na-xiao-zi-zhen-shuai.webp',
        artist: 'SASIOVERLXRD',
        isExplicit: true,
      },
    ],
  },
  {
    id: 'bo-he-shui',
    title: '薄荷水',
    cover: '/images/bo-he-shui.webp',
    artist: 'SASIOVERLXRD',
    isExplicit: true,
    songs: [
      {
        title: '薄荷水',
        src: '/audio/bo-he-shui.mp3',
        cover: '/images/bo-he-shui.webp',
        artist: 'SASIOVERLXRD',
        isExplicit: true,
      },
    ],
  },
  {
    id: 'love-got-me-numb',
    title: 'LOVE GOT ME NUMB',
    cover: '/images/lgmn.webp',
    artist: 'Playboi Carti',
    isExplicit: true,
    songs: [
      {
        title: 'LOVE GOT ME NUMB',
        src: '/audio/lgmn.mp3',
        cover: '/images/lgmn.webp',
        artist: 'Playboi Carti',
        isExplicit: true,
      },
    ],
  },
  {
    id: 'if-looks-could-kill-demo',
    title: 'If Looks Could Kill Demo',
    cover: '/images/if-love-could-kill-demo.webp',
    artist: 'Destroy Lonely',
    isExplicit: true,
    releaseDate: '2024-04-30',
    songs: [
      {
        title: 'LOVE GOT ME NUMB',
        src: '/audio/lgmn.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
    ],
  },
];