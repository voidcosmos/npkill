import { describe, expect, it } from '@jest/globals';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { PACKAGE_DIR } from './support/npkill-package.js';

const ENTRY = join(PACKAGE_DIR, 'lib', 'index.d.ts');
const EXPECTED_TYPES = fileURLToPath(
  new URL('./support/expected-types.ts', import.meta.url),
);

function createProgram(file: string): ts.Program {
  return ts.createProgram([file], {
    strict: true,
    noEmit: true,
    skipLibCheck: true,
    types: ['node'],
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    paths: { '@core/*': [join(PACKAGE_DIR, 'lib', 'core', '*')] },
  });
}

function exportedNames(program: ts.Program): string[] {
  const checker = program.getTypeChecker();
  const entryFile = program.getSourceFile(ENTRY);
  const entryModule = entryFile && checker.getSymbolAtLocation(entryFile);

  if (!entryModule) {
    throw new Error(`Cannot read the exports of ${ENTRY}`);
  }

  return checker
    .getExportsOfModule(entryModule)
    .map((symbol) => symbol.getName())
    .sort();
}

function enclosingTypeName(diagnostic: ts.Diagnostic): string | undefined {
  const textBefore = diagnostic.file?.text.slice(0, diagnostic.start) ?? '';
  return [...textBefore.matchAll(/^export type (\w+)/gm)].pop()?.[1];
}

function typeErrors(program: ts.Program): string[] {
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      ' ',
    );
    const typeName = enclosingTypeName(diagnostic);
    return typeName ? `${typeName}: ${message}` : message;
  });
}

describe('npkill published API', () => {
  it('exports only the 1.0 surface', () => {
    expect(exportedNames(createProgram(ENTRY))).toEqual([
      'DEFAULT_PROFILES',
      'DeleteOptions',
      'DeleteResult',
      'GetNewestFileResult',
      'GetSizeResult',
      'IsValidRootFolderResult',
      'LogEntry',
      'Npkill',
      'NpkillInterface',
      'Profile',
      'RiskAnalysis',
      'ScanFoundTarget',
      'ScanOptions',
    ]);
  });

  it('declares the 1.0 signatures', () => {
    expect(typeErrors(createProgram(EXPECTED_TYPES))).toEqual([]);
  });
});
