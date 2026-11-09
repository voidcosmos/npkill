import { ConsoleService } from '../../../src/cli/services/console.service.js';

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
        '--directory',
        '/sample/path',
        '-D',
        'lala',
        'random text',
        '-f',
        '--exclude-sensitive',
      ];

      const result = consoleService.getParameters(argvs);

      expect(result.isTrue('help')).not.toBeFalsy();
      expect(result.getString('directory')).toBe('/sample/path');
      expect(result.isTrue('delete-all')).not.toBeFalsy();
      expect(result.isTrue('lala')).toBeFalsy();
      expect(result.isTrue('inexistent')).toBeFalsy();
      expect(result.isTrue('full-scan')).not.toBeFalsy();
      expect(result.isTrue('exclude-sensitive')).toBeTruthy();
    });
    it('should get valid parameters 2', () => {
      const argvs = [
        '/usr/bin/ts-node',
        '/blablabla inexistent parameters',
        '-f',
        'lala',
        '--sort=size',
      ];

      const result = consoleService.getParameters(argvs);
      expect(result.isTrue('help')).toBeFalsy();
      expect(result.isTrue('full-scan')).not.toBeFalsy();
      expect(result.getString('sort-by')).toBe('size');
      expect(result.isTrue('exclude-sensitive')).toBeFalsy();
    });
  });

  describe('#getParameters with unknown options', () => {
    it('should collect the options it does not know', () => {
      const argvs = [
        '/usr/bin/node',
        '/usr/bin/npkill',
        '--exlcude',
        'foo',
        '-t',
        'node_modules',
        '--color',
      ];

      const result = consoleService.getParameters(argvs);

      expect(result.getUnknownOptions()).toEqual(['--exlcude', '--color']);
      expect(result.getString('targets')).toBe('node_modules');
    });

    it('should not report known options as unknown', () => {
      const argvs = ['/usr/bin/node', '/usr/bin/npkill', '--sort=size', '-x'];

      const result = consoleService.getParameters(argvs);

      expect(result.getUnknownOptions()).toEqual([]);
    });
  });

  describe('#splitData', () => {
    it('should split data with default separator', () => {
      expect(consoleService.splitData('foo\nbar\nfoot')).toEqual([
        'foo',
        'bar',
        'foot',
      ]);
    });
    it('should split data with custom separator', () => {
      expect(consoleService.splitData('foo;bar;foot', ';')).toEqual([
        'foo',
        'bar',
        'foot',
      ]);
    });
    it('should return empty array if data is empty', () => {
      expect(consoleService.splitData('')).toEqual([]);
    });
  });

  describe('#splitWordsByWidth', () => {
    it('should get array with text according to width', () => {
      const text =
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris faucibus sit amet libero non vestibulum. Morbi ac tellus dolor. Duis consectetur eget lectus sed ullamcorper.';

      expect(consoleService.splitWordsByWidth(text, 43)).toEqual([
        'Lorem ipsum dolor sit amet, consectetur',
        'adipiscing elit. Mauris faucibus sit amet',
        'libero non vestibulum. Morbi ac tellus',
        'dolor. Duis consectetur eget lectus sed',
        'ullamcorper.',
      ]);
    });
  });

  describe('#shortenText', () => {
    const SAMPLE_PATH = '/sample/text/for/test how/service/split/this';

    it.each([
      ['cuts everything with width 0', SAMPLE_PATH, 0, 0, '...'],
      [
        'cuts the middle of the text',
        SAMPLE_PATH,
        32,
        10,
        '/sample/te.../service/split/this',
      ],
      [
        'keeps the start and the end of the text',
        '/aaa/bbb/ccc/ddd/eee/fff/ggg/hhhh/iiii/jjj/kkk',
        16,
        5,
        '/aaa/.../jjj/kkk',
      ],
      [
        'does not modify a text shorter than the width',
        '/neketaro/a:desktop/folder',
        50,
        3,
        '/neketaro/a:desktop/folder',
      ],
      [
        'does not modify the text if cutFrom > width',
        '/sample/text/',
        5,
        7,
        '/sample/text/',
      ],
      ['ignores a negative cutFrom', SAMPLE_PATH, 5, -10, SAMPLE_PATH],
      ['ignores a negative width', SAMPLE_PATH, -10, -20, SAMPLE_PATH],
    ])('%s', (_, text, width, cutFrom, expected) => {
      expect(consoleService.shortenText(text, width, cutFrom)).toEqual(
        expected,
      );
    });
  });
});
