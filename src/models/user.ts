export type User = {
  id: number;
  name: string;
  email: string;
  picture?: string;
  status?: 'online' | 'offline';
};
