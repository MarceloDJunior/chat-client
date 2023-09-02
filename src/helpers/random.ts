export class Random {
  public static fromArray(array: any[]) {
    const index = Math.floor(Math.random() * array.length);
    return array[index];
  }
}
