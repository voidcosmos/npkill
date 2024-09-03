import { OPTIONS, WIDTH_OVERFLOW } from '../../constants/index.js';

import { ICliOptions } from '../interfaces/cli-options.interface.js';
import { extname } from 'path';
import * as readline from 'node:readline';
import { StartParameters } from '../../models/start-parameters.model.js';

export class ConsoleService {
  getParameters(rawArgv: string[]): StartParameters {
    // This needs a refactor, but fck, is a urgent update
    const rawProgramArgvs = this.removeSystemArgvs(rawArgv);
    const argvs = this.normalizeParams(rawProgramArgvs);
    const options: StartParameters = new StartParameters();

    argvs.forEach((argv, index) => {
      if (!this.isArgOption(argv) || !this.isValidOption(argv)) {
        return;
      }
      const nextArgv = argvs[index + 1];
      const option = this.getOption(argv);

      if (option === undefined) {
        throw new Error('Invalid option name.');
      }

      const optionName = option.name;
      options.add(
        optionName,
        this.isArgHavingParams(nextArgv) ? nextArgv : true,
      );
    });

    return options;
  }

  splitWordsByWidth(text: string, width: number): string[] {
    const splitRegex = new RegExp(
      `(?![^\\n]{1,${width}}$)([^\\n]{1,${width}})\\s`,
      'g',
    );
    const splitText = this.replaceString(text, splitRegex, '$1\n');
    return this.splitData(splitText);
  }

  splitData(data: string, separator = '\n'): string[] {
    if (data === '') {
      return [];
    }
    return data.split(separator);
  }

  replaceString(
    text: string,
    textToReplace: string | RegExp,
    replaceValue: string,
  ): string {
    return text.replace(textToReplace, replaceValue);
  }

  shortenText(text: string, width: number, startCut = 0): string {
    if (!this.isValidShortenParams(text, width, startCut)) {
      return text;
    }

    const startPartB = text.length - (width - startCut - WIDTH_OVERFLOW.length);
    const partA = text.substring(startCut, -1);
    const partB = text.substring(startPartB, text.length);

    return partA + WIDTH_OVERFLOW + partB;
  }

  isRunningBuild(): boolean {
    return extname(import.meta.url) === '.js';
  }

  startListenKeyEvents(): void {
    readline.emitKeypressEvents(process.stdin);
  }

  /** Argvs can be specified for example by
   *  "--sort size" and "--sort=size". The main function
   *  expect the parameters as the first form so this
   *  method convert the second to first.
   */
  private normalizeParams(argvs: string[]): string[] {
    return argvs.join('=').split('=');
  }

  private isValidShortenParams(
    text: string,
    width: number,
    startCut: number,
  ): boolean {
    return (
      startCut <= width &&
      text.length >= width &&
      !this.isNegative(width) &&
      !this.isNegative(startCut)
    );
  }

  private removeSystemArgvs(allArgv: string[]): string[] {
    return allArgv.slice(2);
  }

  private isArgOption(argv: string): boolean {
    return argv.charAt(0) === '-';
  }

  private isArgHavingParams(nextArgv: string): boolean {
    return (
      nextArgv !== undefined && nextArgv !== '' && !this.isArgOption(nextArgv)
    );
  }

  private isValidOption(arg: string): boolean {
    return OPTIONS.some((option) => option.arg.includes(arg));
  }

  private getOption(arg: string): ICliOptions | undefined {
    return OPTIONS.find((option) => option.arg.includes(arg));
  }

  private isNegative(numb: number): boolean {
    return numb < 0;
  }
}
