export function isSafeToDelete(path: string, targetFolder: string): boolean {
  return path.includes(targetFolder);
}
