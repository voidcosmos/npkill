export const MAX_WORKERS = 8;
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
