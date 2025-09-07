export interface Song {
  id: number;
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
        id: 12,
        title: '可惜你不在',
        src: '/audio/ke-xi-ni-bu-zai.mp3',
        cover: '/images/na-xiao-zi-zhen-shuai.webp',
        artist: 'SASIOVERLXRD',
        isExplicit: true,
      },
      {
        id: 20,
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
        id: 1,
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
        id: 1,
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
    cover: '/images/if-looks-could-kill-demo.webp',
    artist: 'Destroy Lonely',
    isExplicit: true,
    releaseDate: '2024-04-30',
    songs: [
      {
        id: 1,
        title: 'Jeans Waxed',
        src: '/audio/if-looks-could-kill-demo/jeans-waxed.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 2,
        title: 'Past the Moon',
        src: '/audio/if-looks-could-kill-demo/past-the-moon.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 3,
        title: 'Too Much Ice',
        src: '/audio/if-looks-could-kill-demo/too-much-ice.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 4,
        title: 'Like U Dont Know',
        src: '/audio/if-looks-could-kill-demo/like-u-dont-know.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 5,
        title: 'Jim Carrey',
        src: '/audio/if-looks-could-kill-demo/jim-carrey.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 6,
        title: 'Penthouse',
        src: '/audio/if-looks-could-kill-demo/penthouse.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 7,
        title: 'Money Team',
        src: '/audio/if-looks-could-kill-demo/money-team.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 8,
        title: 'Youngest In Charge',
        src: '/audio/if-looks-could-kill-demo/youngest-in-charge.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 9,
        title: 'Out the Box',
        src: '/audio/if-looks-could-kill-demo/out-the-box.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 10,
        title: 'Proud of Her',
        src: '/audio/if-looks-could-kill-demo/proud-of-her.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 11,
        title: 'The One',
        src: '/audio/if-looks-could-kill-demo/the-one.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 12,
        title: 'Pay for That',
        src: '/audio/if-looks-could-kill-demo/pay-for-that.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 13,
        title: 'Wizard of Oz',
        src: '/audio/if-looks-could-kill-demo/wizard-of-oz.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 14,
        title: 'Who I Am',
        src: '/audio/if-looks-could-kill-demo/who-i-am.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
      {
        id: 15,
        title: 'Prolific',
        src: '/audio/if-looks-could-kill-demo/prolific.mp3',
        cover: '/images/if-looks-could-kill-demo.webp',
        artist: 'Destroy Lonely',
        isExplicit: true,
      },
    ],
  },
];