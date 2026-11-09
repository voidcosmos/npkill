import { ConfigService } from '../../../src/core/services/config.service.js';
import { INpkillrcConfig } from '../../../src/core/interfaces/npkillrc-config.interface.js';
import { writeFileSync } from 'fs';
import { join } from 'path';
import {
  createTempDir,
  inDirectory,
  removeTempDirs,
} from '../../api/support/helpers.js';
import {
  cargoTarget,
  pythonEnvironment,
} from '../../api/support/recognition-contract.js';

describe('ConfigService', () => {
  let configService: ConfigService;
  let tempDir: string;

  beforeEach(() => {
    configService = new ConfigService();
    tempDir = createTempDir();
  });

  afterEach(removeTempDirs);

  function writeConfig(config: object, fileName = '.npkillrc'): string {
    const configPath = join(tempDir, fileName);
    writeFileSync(configPath, JSON.stringify(config));
    return configPath;
  }

  function load(config: object) {
    return configService.loadConfig(writeConfig(config));
  }

  describe('loadConfig', () => {
    it('should return null config when file does not exist', () => {
      const result = configService.loadConfig('/non/existent/path/.npkillrc');

      expect(result.config).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Custom config file not found');
    });

    it('should return error for invalid JSON', () => {
      const configPath = join(tempDir, '.npkillrc');
      writeFileSync(configPath, '{ invalid json }');

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to parse');
    });

    it.each([
      [
        'an invalid sortBy',
        { sortBy: 'invalid-sort' },
        'sortBy must be one of',
      ],
      [
        'unknown properties',
        { unknownProp: 'value', anotherBadProp: 123 },
        'Unknown configuration properties: unknownProp, anotherBadProp',
      ],
      [
        'a dryRun that is not a boolean',
        { dryRun: 'not-a-boolean' },
        'dryRun must be a boolean',
      ],
      [
        'a profile without targets',
        { profiles: { webdev: { description: 'Test' } } },
        'must have a targets property',
      ],
      [
        'a rule without conditions in a profile',
        {
          profiles: {
            custom: {
              description: 'Artifacts',
              targets: ['node_modules', { target: 'target' }],
            },
          },
        },
        'profiles.custom.targets[1]: needs nextTo or contains',
      ],
      [
        'a rootDir that is not a string',
        { rootDir: 123 },
        'rootDir must be a string',
      ],
      [
        'an empty rootDir',
        { rootDir: '   ' },
        'rootDir cannot be an empty string',
      ],
      [
        'defaultProfiles that is not an array',
        { defaultProfiles: 'not-an-array' },
        'defaultProfiles must be an array',
      ],
      [
        'defaultProfiles with items that are not strings',
        { defaultProfiles: ['node', 123, 'python'] },
        'All defaultProfiles items must be strings',
      ],
      [
        'empty defaultProfiles',
        { defaultProfiles: [] },
        'defaultProfiles must not be empty',
      ],
      [
        'an unknown profile property',
        {
          profiles: {
            custom: {
              description: 'Artifacts',
              targets: ['dist'],
              extends: 'node',
            },
          },
        },
        'profiles.custom.extends: unknown property',
      ],
      [
        'a profile called all',
        { profiles: { all: { description: 'Everything', targets: ['dist'] } } },
        'profiles.all is reserved',
      ],
      [
        'an unknown default profile',
        { defaultProfiles: ['node', 'missing'] },
        'unknown profile "missing"',
      ],
    ])('should reject %s', (_case, config, expectedError) => {
      const result = load(config);

      expect(result.config).toBeNull();
      expect(result.error).toContain(expectedError);
    });

    it('should load names and rules without losing conditions', () => {
      const config = {
        profiles: {
          custom: {
            description: 'Artifacts',
            targets: ['node_modules', cargoTarget, pythonEnvironment],
          },
        },
      };

      const result = load(config);

      expect(result.error).toBeUndefined();
      expect(result.config).toEqual(config);
    });
  });

  describe('getUserDefinedProfiles', () => {
    it.each([
      ['config is null', null],
      ['profiles is undefined', { exclude: ['.git'] }],
    ])('should return empty object when %s', (_case, config) => {
      const profiles = configService.getUserDefinedProfiles(config);

      expect(profiles).toEqual({});
    });
  });

  describe('mergeConfigs', () => {
    it('should return base config when file config is null', () => {
      const baseConfig = {
        exclude: ['.git'],
        sortBy: 'none',
      };

      const merged = configService.mergeConfigs(baseConfig, null);

      expect(merged).toEqual(baseConfig);
    });

    it.each([
      ['sortBy', 'none', 'size'],
      ['sizeUnit', 'auto', 'mb'],
      ['dryRun', false, true],
      ['rootDir', undefined, '/custom/projects'],
      ['defaultProfiles', ['node'], ['node', 'python', 'webdev']],
    ])(
      'should override %s with the file config value',
      (property, baseValue, fileValue) => {
        const fileConfig = { [property]: fileValue } as INpkillrcConfig;

        const merged = configService.mergeConfigs(
          { [property]: baseValue },
          fileConfig,
        );

        expect(merged[property]).toEqual(fileValue);
      },
    );

    it('should merge exclude arrays without duplicates', () => {
      const baseConfig = {
        exclude: ['.git'],
      };
      const fileConfig: INpkillrcConfig = {
        exclude: ['node_modules', '.git'],
      };

      const merged = configService.mergeConfigs(baseConfig, fileConfig);

      expect(merged.exclude).toContain('.git');
      expect(merged.exclude).toContain('node_modules');
      expect(merged.exclude?.length).toBe(2);
    });

    it('should preserve base config properties not in file config', () => {
      const baseConfig = {
        sortBy: 'none',
        dryRun: false,
      };
      const fileConfig: INpkillrcConfig = {
        sortBy: 'size',
      };

      const merged = configService.mergeConfigs(baseConfig, fileConfig);

      expect(merged.sortBy).toBe('size');
      expect(merged.dryRun).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should load a complete realistic config file', () => {
      const realisticConfig: INpkillrcConfig = {
        rootDir: '/home/user/my-projects',
        exclude: ['.git', 'important-project'],
        sortBy: 'age',
        sizeUnit: 'auto',
        excludeSensitiveResults: false,
        dryRun: false,
        checkUpdates: true,
        defaultProfiles: ['node', 'frontend'],
        profiles: {
          frontend: {
            description: 'Frontend projects',
            targets: ['node_modules', 'dist', 'build'],
          },
          backend: {
            description: 'Backend projects',
            targets: ['node_modules', 'venv', 'target'],
          },
        },
      };

      const result = load(realisticConfig);

      expect(result.error).toBeUndefined();
      expect(result.config).toEqual(realisticConfig);
      expect(configService.getUserDefinedProfiles(result.config)).toEqual(
        realisticConfig.profiles,
      );
    });
  });

  describe('config file resolution priority', () => {
    it('should prioritize custom path over cwd and home', async () => {
      const customPath = writeConfig({ sortBy: 'size' }, 'custom.json');
      writeConfig({ sortBy: 'path' });

      const result = await inDirectory(tempDir, async () =>
        configService.loadConfig(customPath),
      );

      expect(result.config).not.toBeNull();
      expect(result.config?.sortBy).toBe('size');
    });

    it('should use cwd config when no custom path provided and cwd config exists', async () => {
      const cwdPath = writeConfig({ sortBy: 'size', exclude: ['from-cwd'] });

      const result = await inDirectory(tempDir, async () =>
        configService.loadConfig(),
      );

      expect(result.config).not.toBeNull();
      expect(result.config?.sortBy).toBe('size');
      expect(result.config?.exclude).toContain('from-cwd');
      expect(result.configPath).toBe(cwdPath);
    });
  });
});
