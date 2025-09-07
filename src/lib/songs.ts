export interface Song {
  title: string;
  src: string;
  cover: string;
  artist: string;
  isExplicit: boolean;
}

export const songs: Song[] = [
  {
    title: '薄荷水',
    src: '/audio/bo-he-shui.mp3',
    cover: '/images/bo-he-shui.webp',
    artist: 'SASIOVERLXRD',
    isExplicit: true,
  },
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
];