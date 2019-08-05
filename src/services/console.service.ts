import { ICliOptions } from '@interfaces/cli-options.interface';
import { OPTIONS } from '@constants/cli.constants';
import { WIDTH_OVERFLOW } from '@constants/main.constants';

export class ConsoleService {
  getParameters(rawArgv: string[]): {} {
    const argvs = this.removeSystemArgvs(rawArgv);
    const options = {};

    const validArgvs = this.getValidArgvs(rawArgv);

    validArgvs.map((argv, index) => {
      const nextArgv = argvs[index + 1];
      options[argv.name] = nextArgv ? nextArgv : true;
    });

    return options;
  }

  splitWordsByWidth(text: string, width: number): string[] {
    const splitRegex = new RegExp(
      `(?![^\\n]{1,${width}}$)([^\\n]{1,${width}})\\s`,
      'g',
    );
    const splitText = text.replace(splitRegex, '$1\n');
    return this.splitData(splitText);
  }

  splitData(data: string, separator = '\n'): string[] {
    return data.split(separator);
  }

  shortenText(text: string, width: number, startCut = 0): string {
    if (!this.isValidShortenParams(text, width, startCut)) return text;

    const startPartB = text.length - (width - startCut - WIDTH_OVERFLOW.length);
    const partA = text.substring(startCut, -1);
    const partB = text.substring(startPartB, text.length);

    return partA + WIDTH_OVERFLOW + partB;
  }

  private isValidShortenParams(text: string, width: number, startCut: number) {
    return (
      startCut <= width &&
      text.length >= width &&
      !this.isNegative(width) &&
      !this.isNegative(startCut)
    );
  }

  private getValidArgvs(rawArgv: string[]): ICliOptions[] {
    const argvs = rawArgv.map(argv => this.getOption(argv));
    return argvs.filter(argv => argv);
  }

  private removeSystemArgvs(allArgv: string[]): string[] {
    return allArgv.slice(2);
  }

  private isArgOption(argv: string): boolean {
    return !!argv && argv.charAt(0) === '-';
  }
  private getOption(arg: string): ICliOptions | undefined {
    return OPTIONS.find(option => option.arg.includes(arg));
  }

  private isNegative(numb: number): boolean {
    return numb < 0;
  }
}
