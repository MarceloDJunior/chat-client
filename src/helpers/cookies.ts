import { Cookies } from 'react-cookie';

const cookies = new Cookies();

export class CookiesHelper {
  static set(key: string, value: string): void {
    cookies.set(key, value);
  }

  static get(key: string): string {
    return cookies.get(key);
  }

  static remove(key: string): void {
    cookies.remove(key);
  }
}
