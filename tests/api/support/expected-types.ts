/* eslint-disable n/no-missing-import */
import type { Observable } from 'rxjs';
import type {
  DEFAULT_PROFILES,
  DeleteError,
  DeleteResult,
  GetSizeResult,
  LogEntry,
  Npkill,
  NpkillInterface,
  Profile,
  ScanOptions,
} from '../../../.test-build/npkill-api/lib/index.js';

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
export type UseDefaultIgnoreIsAnOptionalSwitch = Expect<
  Equal<ScanOptions['useDefaultIgnore'], boolean | undefined>
>;
export type LogsArriveOneByOne = Expect<
  Equal<ReturnType<Npkill['getLogs$']>, Observable<LogEntry>>
>;
export type TargetsAcceptReadonlyLists = Expect<
  Equal<ScanOptions['targets'], readonly string[]>
>;
export type BuiltInProfilesAreReadonly = Expect<
  Equal<typeof DEFAULT_PROFILES, Readonly<Record<string, Profile>>>
>;
export type ProfileTargetsAreReadonly = Expect<
  Equal<Profile['targets'], readonly string[]>
>;
export type FailedDeletionsAlwaysCarryAnError = Expect<
  Equal<Extract<DeleteResult, { success: false }>['error'], DeleteError>
>;
export type SuccessfulDeletionsCarryNoError = Expect<
  Equal<Extract<keyof Extract<DeleteResult, { success: true }>, 'error'>, never>
>;
