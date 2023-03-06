import { User } from './user';

export type Contact = User & {
  newMessages?: number;
};
