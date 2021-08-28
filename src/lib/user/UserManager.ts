import { PublicUser } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class UserManager extends Manager {
  /**
   * @description Get a user by ID.
   * @param  {string} id The ID of the user.
   * @returns {Promise<PublicUser>} Returns a promise with the {@link PublicUser}.
   */
  async get(id: string): Promise<PublicUser> {
    const res = await this.http.get(`/users/${id}`);

    return (await res.json()) as PublicUser;
  }
}
