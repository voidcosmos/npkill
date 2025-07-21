export const MAX_WORKERS = 8;
// More PROCS improve the speed of the search in the worker,
// but it will greatly increase the maximum ram usage.
export const MAX_PROCS = 100;
export enum EVENTS {
  startup = 'startup',
  alive = 'alive',
  exploreConfig = 'exploreConfig',
  explore = 'explore',
  scanResult = 'scanResult',
  getFolderSize = 'getFolderSize',
  getFolderSizeResult = 'getFolderSizeResult',
}
