export function chunk<T>(array: T[], chunkSize: number): T[][] {
  const tempArray: T[][] = [];

  for (let i = 0; i < array.length; i += chunkSize) {
    tempArray.push(array.slice(i, i + chunkSize));
  }

  return tempArray;
}
