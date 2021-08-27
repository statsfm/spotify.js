import { ExternalUrls, Image } from './shared';
import { Followers } from './shared/Followers';

export interface PublicUser {
  display_name?: string;
  external_urls: ExternalUrls;
  followers: Followers;
  href: string;
  id: string;
  images: Image[];
  type: string;
  uri: string;
}
