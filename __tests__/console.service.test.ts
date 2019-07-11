import { ConsoleService } from '../src/services/console.service';

describe('Console Service', () => {
  let consoleService: ConsoleService;
  beforeAll(() => {
    consoleService = new ConsoleService();
  });

  describe('#getParameters', () => {
    it('should get valid parameters', () => {
      const argvs = [
        '/usr/bin/ts-node',
        '/blablabla inexistent parameters',
        '-h',
        '--root',
        '/sample/path',
        '-D',
        'lala',
        'random text',
        '-f',
      ];

      const result = consoleService.getParameters(argvs);

      expect(result['help']).not.toBeFalsy();
      expect(result['root']).toBe('/sample/path');
      expect(result['delete-all']).not.toBeFalsy();
      expect(result['lala']).toBeUndefined();
      expect(result['inexistent']).toBeUndefined();
      expect(result['full']).not.toBeFalsy();
    });
    /*it('should get valid parameters 2', () => {
      const argvs = [
        '/usr/bin/ts-node',
        '/blablabla inexistent parameters',
        '-f',
        'lala',
      ];

      const result = consoleService.getParameters(argvs);
      expect(result['help']).toBeFalsy();
      expect(result['full']).not.toBeFalsy();
    });*/
  });
});
