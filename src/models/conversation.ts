import { Message } from './message';
import { Contact } from './contact';

export type Conversation = {
  contact: Contact;
  lastMessage?: Message;
  newMessages?: number;
};
