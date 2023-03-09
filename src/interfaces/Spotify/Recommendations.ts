import { Track } from '.';

export interface RecommendationsSeed {
  initialPoolSize: number;
  afterFilteringSize: number;
  afterRelinkingSize: number;
  id: string;
  type: 'ARTIST' | 'TRACK' | 'GENRE';
  href: string;
}

export interface RecommendationsResult {
  tracks: Track[];
  seeds: RecommendationsSeed[];
}

export * from './RecommendationsFilters';
