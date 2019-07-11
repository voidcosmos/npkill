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

  describe('#splitStringIntoArrayByCharactersWidth', () => {
    it('should get array with text according to width', () => {
      const cases = [
        {
          text:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris faucibus sit amet libero non vestibulum. Morbi ac tellus dolor. Duis consectetur eget lectus sed ullamcorper.',
          width: 43,
          expect: [
            'Lorem ipsum dolor sit amet, consectetur',
            'adipiscing elit. Mauris faucibus sit amet',
            'libero non vestibulum. Morbi ac tellus',
            'dolor. Duis consectetur eget lectus sed',
            'ullamcorper.',
          ],
        },
        /* {
          text: 'Lorem ipsum dolor sit amet.',
          width: 2,
          expect: ['Lorem', 'ipsum', 'dolor', 'sit', 'amet.'],
        }, */
      ];

      cases.forEach(cas => {
        expect(
          consoleService.splitStringIntoArrayByCharactersWidth(
            cas.text,
            cas.width,
          ),
        ).toEqual(cas.expect);
      });
    });
  });
});
