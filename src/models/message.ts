import { User } from './user';

export type Message = {
  text: string;
  from: User;
  to: User;
  dateTime: Date;
};
