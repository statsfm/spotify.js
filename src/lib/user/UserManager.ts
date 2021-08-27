import { PublicUser } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class UserManager extends Manager {
  async get(id: string): Promise<PublicUser> {
    const res = await this.http.get(`/users/${id}`);

    return (await res.json()) as PublicUser;
  }
}
