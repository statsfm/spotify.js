import { UserPublic } from '../../interfaces/Spotify';
import { Manager } from '../Manager';

export class UserManager extends Manager {
  /**
   * @description Get a user by ID.
   * @param  {string} id The ID of the user.
   * @returns {Promise<UserPublic>} Returns a promise with the {@link UserPublic}.
   */
  async get(id: string): Promise<UserPublic> {
    const res = await this.http.get(`/users/${id}`);

    return res.data as UserPublic;
  }
}
