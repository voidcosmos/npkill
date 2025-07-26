import { readFileSync } from 'fs';

export function getFileContent(path: string): string {
  const encoding = 'utf8';
  return readFileSync(path, encoding);
}
