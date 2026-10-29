import path from 'path';

export function getTestFile(fileName: string) {
  return path.resolve(__dirname, '../test-data', fileName);
}
