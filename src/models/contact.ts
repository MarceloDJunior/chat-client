import { User } from './user';

export type Contact = User & {
  status?: 'online' | 'offline';
};
