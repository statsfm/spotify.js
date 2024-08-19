import { HttpClient } from './http/HttpClient';

export abstract class Manager {
  // eslint-disable-next-line no-unused-vars
  constructor(protected readonly http: HttpClient) {}
}
