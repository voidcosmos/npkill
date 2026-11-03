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
    skipLibCheck: false,
    types: ['node'],
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
  });
}

function resolveAlias(checker: ts.TypeChecker, symbol: ts.Symbol): ts.Symbol {
  return symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
}

function entryExports(program: ts.Program): ts.Symbol[] {
  const checker = program.getTypeChecker();
  const entryFile = program.getSourceFile(ENTRY);
  const entryModule = entryFile && checker.getSymbolAtLocation(entryFile);

  if (!entryModule) {
    throw new Error(`Cannot read the exports of ${ENTRY}`);
  }

  return checker.getExportsOfModule(entryModule);
}

function exportedNames(program: ts.Program): string[] {
  return entryExports(program)
    .map((symbol) => symbol.getName())
    .sort();
}

function exportedDeclarations(program: ts.Program): ts.Declaration[] {
  const checker = program.getTypeChecker();
  return entryExports(program)
    .map((symbol) => resolveAlias(checker, symbol))
    .flatMap((symbol) => symbol.declarations ?? []);
}

function isPrivate(member: ts.ClassElement): boolean {
  return (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Private) !== 0;
}

function withoutPrivateMembers(declaration: ts.Node): ts.Node {
  if (!ts.isClassDeclaration(declaration)) {
    return declaration;
  }

  return ts.factory.updateClassDeclaration(
    declaration,
    declaration.modifiers,
    declaration.name,
    declaration.typeParameters,
    declaration.heritageClauses,
    declaration.members.filter((member) => !isPrivate(member)),
  );
}

function declarationText(declaration: ts.Declaration): string {
  const statement = ts.isVariableDeclaration(declaration)
    ? declaration.parent.parent
    : declaration;
  const printer = ts.createPrinter({ removeComments: true });
  return printer.printNode(
    ts.EmitHint.Unspecified,
    withoutPrivateMembers(statement),
    declaration.getSourceFile(),
  );
}

function publicDeclarations(program: ts.Program): string {
  return exportedDeclarations(program).map(declarationText).sort().join('\n\n');
}

function isOwnDeclaration(declaration: ts.Declaration): boolean {
  return declaration.getSourceFile().fileName.startsWith(PACKAGE_DIR);
}

function forgottenExports(program: ts.Program): string[] {
  const checker = program.getTypeChecker();
  const exported = new Set(
    entryExports(program).map((symbol) => resolveAlias(checker, symbol)),
  );
  const forgotten = new Set<string>();

  const visit = (node: ts.Node): void => {
    const reference = ts.isTypeReferenceNode(node)
      ? node.typeName
      : ts.isExpressionWithTypeArguments(node)
        ? node.expression
        : undefined;
    const symbol = reference && checker.getSymbolAtLocation(reference);
    const target = symbol && resolveAlias(checker, symbol);
    const isForgotten =
      target !== undefined &&
      !(target.flags & ts.SymbolFlags.TypeParameter) &&
      !exported.has(target) &&
      (target.declarations ?? []).some(isOwnDeclaration);

    if (isForgotten) {
      forgotten.add(target.getName());
    }
    ts.forEachChild(node, visit);
  };

  exportedDeclarations(program).forEach(visit);
  return [...forgotten].sort();
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
      'DeleteError',
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

  it('only references types that consumers can import', () => {
    expect(forgottenExports(createProgram(ENTRY))).toEqual([]);
  });

  it('keeps the public declarations unchanged', () => {
    expect(publicDeclarations(createProgram(ENTRY))).toMatchSnapshot();
  });
});
