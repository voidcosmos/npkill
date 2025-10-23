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
        '--exclude-hidden-directories',
      ];

      const result = consoleService.getParameters(argvs);

      expect(result.isTrue('help')).not.toBeFalsy();
      expect(result.getString('directory')).toBe('/sample/path');
      expect(result.isTrue('delete-all')).not.toBeFalsy();
      expect(result.isTrue('lala')).toBeFalsy();
      expect(result.isTrue('inexistent')).toBeFalsy();
      expect(result.isTrue('full-scan')).not.toBeFalsy();
      expect(result.isTrue('exclude-hidden-directories')).not.toBeFalsy();
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
      expect(result.isTrue('exclude-hidden-directories')).toBeFalsy();
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
      const cases = [
        {
          expect: [
            'Lorem ipsum dolor sit amet, consectetur',
            'adipiscing elit. Mauris faucibus sit amet',
            'libero non vestibulum. Morbi ac tellus',
            'dolor. Duis consectetur eget lectus sed',
            'ullamcorper.',
          ],
          text:
            // tslint:disable-next-line: max-line-length
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris faucibus sit amet libero non vestibulum. Morbi ac tellus dolor. Duis consectetur eget lectus sed ullamcorper.',
          width: 43,
        },
        /* {
          text: 'Lorem ipsum dolor sit amet.',
          width: 2,
          expect: ['Lorem', 'ipsum', 'dolor', 'sit', 'amet.'],
        }, */
      ];

      cases.forEach((cas) => {
        expect(consoleService.splitWordsByWidth(cas.text, cas.width)).toEqual(
          cas.expect,
        );
      });
    });
  });

  describe('#shortenText', () => {
    it('should short text according parameters', () => {
      const cases = [
        {
          cutFrom: 0,
          expect: '...',
          text: '/sample/text/for/test how/service/split/thisA',
          width: 0,
        },
        {
          cutFrom: 10,
          expect: '/sample/te.../service/split/this',
          text: '/sample/text/for/test how/service/split/this',
          width: 32,
        },
        {
          cutFrom: 5,
          expect: '/aaa/.../jjj/kkk',
          text: '/aaa/bbb/ccc/ddd/eee/fff/ggg/hhhh/iiii/jjj/kkk',
          width: 16,
        },
        {
          cutFrom: 3,
          expect: '/neketaro/a:desktop/folder',
          text: '/neketaro/a:desktop/folder',
          width: 50,
        },
      ];

      cases.forEach((cas) => {
        const result = consoleService.shortenText(
          cas.text,
          cas.width,
          cas.cutFrom,
        );
        expect(result).toEqual(cas.expect);
      });
    });

    it('should no modify input if "cutFrom" > text length', () => {
      const text = '/sample/text/';
      const expectResult = '/sample/text/';
      const width = 5;
      const cutFrom = 50;

      const result = consoleService.shortenText(text, width, cutFrom);
      expect(result).toEqual(expectResult);
    });

    it('should no modify input if "cutFrom" > width', () => {
      const text = '/sample/text/';
      const expectResult = '/sample/text/';
      const width = 5;
      const cutFrom = 7;

      const result = consoleService.shortenText(text, width, cutFrom);
      expect(result).toEqual(expectResult);
    });

    it('should ignore negative parameters', () => {
      const cases = [
        {
          cutFrom: -10,
          expect: '/sample/text/for/test how/service/split/thisA',
          text: '/sample/text/for/test how/service/split/thisA',
          width: 5,
        },
        {
          cutFrom: 10,
          expect: '/sample/text/for/test how/service/split/thisB',
          text: '/sample/text/for/test how/service/split/thisB',
          width: -10,
        },
        {
          cutFrom: -20,
          expect: '/sample/text/for/test how/service/split/thisC',
          text: '/sample/text/for/test how/service/split/thisC',
          width: -10,
        },
      ];

      cases.forEach((cas) => {
        const result = consoleService.shortenText(
          cas.text,
          cas.width,
          cas.cutFrom,
        );
        expect(result).toEqual(cas.expect);
      });
    });
  });
});
