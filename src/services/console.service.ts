import { OPTIONS } from '../constants/cli.constants';

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
}
