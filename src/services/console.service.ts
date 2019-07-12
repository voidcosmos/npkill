import { OPTIONS } from '../constants/cli.constants';
import { WIDTH_OVERFLOW } from '../constants/main.constants';

export class ConsoleService {
  constructor() {}

  getParameters(argv: string[]): Object {
    argv = argv.slice(2); //The first two arguments represent cli env routes that are not necessary.
    let options: Object = {};

    for (let i = 0; i < argv.length; ++i) {
      const argName = this.getArgName(argv[i]);

      if (!argName) {
        continue;
      }

      if (!this.argHaveOption(argv[i + 1])) {
        options[argName] = argv[i + 1] ? argv[i + 1] : true;
        i++;
        continue;
      }

      options[argName] = true;

      // options[argName] = this.argHaveOption(argv[i + 1]) ? true : argv[i + 1];
    }
    return options;
  }

  private argHaveOption(argv: string) {
    return !!argv && argv.charAt(0) === '-';
  }
  private getArgName(arg: string) {
    const object = OPTIONS.find(option => option.ARG.includes(arg));
    return object ? object.NAME : undefined;
  }

  splitStringIntoArrayByCharactersWidth(
    string: string,
    width: number,
  ): string[] {
    const text = string.split(' ');

    // Caotic. Improve in next commits
    return text.reduce(
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

  shortenText(text: string, width: number, cutFrom: number = 0) {
    if (text.length < width) return text;
    if (!width || !cutFrom || width < 1 || cutFrom < 1 || cutFrom > width)
      return text;
    if (!cutFrom) cutFrom = width / 2;

    const startPartB = text.length - (width - cutFrom - WIDTH_OVERFLOW.length);
    const partA = text.substring(cutFrom, -1);
    const partB = text.substring(startPartB, text.length);

    return partA + WIDTH_OVERFLOW + partB;
  }
}
