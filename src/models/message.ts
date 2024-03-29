import { User } from './user';

export type Message = {
  id?: number;
  text: string;
  from: User;
  to: User;
  dateTime: Date;
  read: boolean;
  pending?: boolean;
  progress?: number;
  fileUrl?: string;
  fileName?: string;
};
