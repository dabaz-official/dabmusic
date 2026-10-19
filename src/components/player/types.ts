import type { Lyrics } from '@/lib/lrc';
import type { Song } from '@/lib/albums';

/** Everything a player surface needs to render and drive playback. */
export interface PlayerViewProps {
  song: Song;
  isPlaying: boolean;
  isShuffle: boolean;
  isLoop: boolean;
  isLyricsOpen: boolean;
  hasLyrics: boolean;
  /** 0-100. */
  progress: number;
  currentTime: number;
  duration: number;
  /** 0-1. */
  volume: number;
  muted: boolean;
  lyrics: Lyrics;
  /** Index of the highlighted line, or -1. */
  activeIndex: number;
  secondaryRevealed: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleLoop: () => void;
  onSeek: (seconds: number) => void;
  onSeekProgress: (percent: number) => void;
  onVolumeChange: (percent: number) => void;
  onToggleMute: () => void;
  onToggleLyrics: () => void;
}
