/* eslint-disable n/no-missing-import */
import type { Observable } from 'rxjs';
import type {
  GetSizeResult,
  LogEntry,
  Npkill,
  NpkillInterface,
  ScanOptions,
} from '../../../node_modules/.cache/npkill-api/lib/index.js';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

export type ConstructorTakesNoArguments = Expect<
  Equal<ConstructorParameters<typeof Npkill>, []>
>;
export type OnlyInterfaceMembersArePublic = Expect<
  Equal<keyof Npkill, keyof NpkillInterface>
>;
export type StartScanRequiresOptions = Expect<
  Equal<
    Parameters<NpkillInterface['startScan$']>,
    [rootPath: string, options: ScanOptions]
  >
>;
export type GetSizeOnlyTakesAPath = Expect<
  Equal<Parameters<NpkillInterface['getSize$']>, [path: string]>
>;
export type GetSizeResultIsOnlyBytes = Expect<
  Equal<GetSizeResult, { size: number }>
>;
export type ScanOptionsHasNoSortBy = Expect<
  Equal<Extract<keyof ScanOptions, 'sortBy'>, never>
>;
export type LogsArriveOneByOne = Expect<
  Equal<ReturnType<Npkill['getLogs$']>, Observable<LogEntry>>
>;
