import { Track } from './Track';

export interface RecentlyPlayed {
  played_at: Date;
  context: string;
  track: Track;
}
