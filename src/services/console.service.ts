import { OPTIONS } from '../constants/cli.constants';
import { WIDTH_OVERFLOW } from '../constants/main.constants';
import { ICliOptions } from '../interfaces/cli-options.interface';

export class ConsoleService {
  getParameters(rawArgv: string[]): {} {
    const argvs = rawArgv.slice(2); // The first two arguments represent cli env routes that are not necessary.
    const options: {} = {};

    for (let i = 0; i < argvs.length; ++i) {
      const option = this.getOption(argvs[i]);

      if (!option) continue;

      const { name } = option;

      if (!this.argHaveOption(argvs[i + 1])) {
        options[name] = argvs[i + 1] ? argvs[i + 1] : true;
        i++;
        continue;
      }

      options[name] = true;

      // options[name] = this.argHaveOption(argv[i + 1]) ? true : argv[i + 1];
    }
    return options;
  }
  splitStringIntoArrayByCharactersWidth(text: string, width: number): string[] {
    const splitedText = text.split(' ');

    // Caotic. Improve in next commits
    return splitedText.reduce(
      (acc: string[], line: string) => {
        const indexLastLine = acc.length - 1;
        const formingLine = acc[indexLastLine] ? acc[indexLastLine] : '';
        const temp = !formingLine ? line : `${formingLine} ${line}`;
        if (temp.length <= width) {
          acc[indexLastLine] = temp;
        } else {
          acc = [...acc, line];
        }
        return line ? acc : [];
      },
      [''],
    );
  }

  shortenText(text: string, width: number, cutFrom: number = 0): string {
    if (text.length < width) return text;

    if (!width || !cutFrom || width < 1 || cutFrom < 1 || cutFrom > width)
      return text;

    if (!cutFrom) cutFrom = width / 2;

    const startPartB = text.length - (width - cutFrom - WIDTH_OVERFLOW.length);
    const partA = text.substring(cutFrom, -1);
    const partB = text.substring(startPartB, text.length);

    return partA + WIDTH_OVERFLOW + partB;
  }

  private argHaveOption(argv: string): boolean {
    return !!argv && argv.charAt(0) === '-';
  }
  private getOption(arg: string): ICliOptions | undefined {
    return OPTIONS.find(option => option.arg.includes(arg));
  }
}
