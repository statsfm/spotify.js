import { Track } from '.';

export interface Actions {
  interrupting_playback: boolean;
  pausing: boolean;
  resuming: boolean;
  seeking: boolean;
  skipping_next: boolean;
  skipping_prev: boolean;
  toggling_repeat_context: boolean;
  toggling_shuffle: boolean;
  toggling_repeat_track: boolean;
  transferring_playback: boolean;
}

export interface Device {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

export interface PlayerState {
  device: Device;
  shuffle_state: boolean;
  repeat_state: string;
  timestamp: number;
  context: null;
  progress_ms: number;
  item: Track;
  currently_playing_type: string;
  actions: Actions;
  is_playing: boolean;
}
