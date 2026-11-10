/* eslint-disable n/no-missing-import */
import type { Observable } from 'rxjs';
import type {
  DeleteError,
  DeleteResult,
  GetNewestFileResult,
  TargetDefinition,
  TargetRule,
  GetSizeResult,
  LogEntry,
  Npkill,
  NpkillInterface,
  ScanOptions,
  ScanResult,
  ValidateRootResult,
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
export type ScansEmitScanResults = Expect<
  Equal<ReturnType<Npkill['startScan$']>, Observable<ScanResult>>
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
export type NewestFileCarriesItsModificationTime = Expect<
  Equal<
    GetNewestFileResult,
    { path: string; name: string; modificationTime: number }
  >
>;
export type ValidateRootReturnsAResult = Expect<
  Equal<NpkillInterface['validateRoot'], (path: string) => ValidateRootResult>
>;
export type LogsArriveOneByOne = Expect<
  Equal<ReturnType<Npkill['getLogs$']>, Observable<LogEntry>>
>;
export type LogEntriesUseLevel = Expect<
  Equal<
    LogEntry,
    { level: 'info' | 'warn' | 'error'; timestamp: number; message: string }
  >
>;
export type TargetsAcceptReadonlyLists = Expect<
  Equal<ScanOptions['targets'], readonly TargetDefinition[]>
>;
export type FailedDeletionsAlwaysCarryAnError = Expect<
  Equal<Extract<DeleteResult, { success: false }>['error'], DeleteError>
>;
export type SuccessfulDeletionsCarryNoError = Expect<
  Equal<Extract<keyof Extract<DeleteResult, { success: true }>, 'error'>, never>
>;
export type TargetsAreNamesOrRules = Expect<
  Equal<TargetDefinition, string | TargetRule>
>;
export type RulesOnlyListNames = Expect<
  Equal<
    TargetRule,
    {
      readonly target: string;
      readonly nextTo?: readonly string[];
      readonly contains?: readonly string[];
    }
  >
>;
