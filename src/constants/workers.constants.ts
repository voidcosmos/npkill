export const MAX_WORKERS = 16;
// Workers spend most of a cold scan waiting for the disk.
export const WORKERS_PER_CORE = 2;
// More PROCS improve the speed of the search in the worker,
// but it will greatly increase the maximum ram usage.
export const MAX_PROCS = 100;
export enum EVENTS {
  startup = 'startup',
  alive = 'alive',
  explore = 'explore',
  scanResult = 'scanResult',
  scanFinished = 'scanFinished',
  getSize = 'getSize',
  GetSizeResult = 'GetSizeResult',
  error = 'error',
}
