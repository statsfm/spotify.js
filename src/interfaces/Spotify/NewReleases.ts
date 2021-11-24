import { Album } from '.';
import { PagingObject } from './shared';

export interface NewReleases {
  albums: PagingObject<Album>;
}
