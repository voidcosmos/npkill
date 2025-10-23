import { ConfigService } from '../../../src/core/services/config.service.js';
import { INpkillrcConfig } from '../../../src/core/interfaces/npkillrc-config.interface.js';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ConfigService', () => {
  let configService: ConfigService;
  let tempDir: string;

  beforeEach(() => {
    configService = new ConfigService();
    tempDir = join(tmpdir(), `npkill-test-${Date.now()}`);
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should return null config when file does not exist', () => {
      const result = configService.loadConfig('/non/existent/path/.npkillrc');

      expect(result.config).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Custom config file not found');
    });

    it('should load valid configuration file', () => {
      const configPath = join(tempDir, '.npkillrc');
      const validConfig: INpkillrcConfig = {
        targets: ['node_modules', '.venv'],
        exclude: ['.git', 'important'],
        sortBy: 'size',
        backgroundColor: 'bgCyan',
      };

      writeFileSync(configPath, JSON.stringify(validConfig, null, 2));

      const result = configService.loadConfig(configPath);

      expect(result.config).not.toBeNull();
      expect(result.error).toBeUndefined();
      expect(result.config?.targets).toEqual(['node_modules', '.venv']);
      expect(result.config?.sortBy).toBe('size');
    });

    it('should return error for invalid JSON', () => {
      const configPath = join(tempDir, '.npkillrc');
      writeFileSync(configPath, '{ invalid json }');

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Failed to parse');
    });

    it('should validate targets array', () => {
      const configPath = join(tempDir, '.npkillrc');
      const invalidConfig = {
        targets: 'not-an-array',
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig));

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toContain('targets must be an array');
    });

    it('should validate sortBy values', () => {
      const configPath = join(tempDir, '.npkillrc');
      const invalidConfig = {
        sortBy: 'invalid-sort',
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig));

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toContain('sortBy must be one of');
    });

    it('should reject unknown properties', () => {
      const configPath = join(tempDir, '.npkillrc');
      const invalidConfig = {
        targets: ['node_modules'],
        unknownProp: 'value',
        anotherBadProp: 123,
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig));

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toContain('Unknown configuration');
      expect(result.error).toContain('unknownProp');
      expect(result.error).toContain('anotherBadProp');
    });

    it('should validate backgroundColor values', () => {
      const configPath = join(tempDir, '.npkillrc');
      const invalidConfig = {
        backgroundColor: 'invalidColor',
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig));

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toContain('backgroundColor must be one of');
    });

    it('should validate boolean fields', () => {
      const configPath = join(tempDir, '.npkillrc');
      const invalidConfig = {
        dryRun: 'not-a-boolean',
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig));

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toContain('dryRun must be a boolean');
    });

    it('should load and validate custom profiles', () => {
      const configPath = join(tempDir, '.npkillrc');
      const validConfig: INpkillrcConfig = {
        profiles: {
          webdev: {
            description: 'Web development',
            targets: ['node_modules', 'dist', '.next'],
          },
          python: {
            description: 'Python development',
            targets: ['.venv', '__pycache__'],
          },
        },
      };

      writeFileSync(configPath, JSON.stringify(validConfig, null, 2));

      const result = configService.loadConfig(configPath);

      expect(result.config).not.toBeNull();
      expect(result.config?.profiles).toBeDefined();
      expect(Object.keys(result.config?.profiles || {}).length).toBe(2);
      expect(result.config?.profiles?.webdev).toBeDefined();
      expect(result.config?.profiles?.webdev?.targets).toEqual([
        'node_modules',
        'dist',
        '.next',
      ]);
    });

    it('should reject profiles without targets', () => {
      const configPath = join(tempDir, '.npkillrc');
      const invalidConfig = {
        profiles: {
          webdev: {
            description: 'Test',
          },
        },
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig));

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toContain('must have a targets property');
    });

    it('should reject profiles with empty targets array', () => {
      const configPath = join(tempDir, '.npkillrc');
      const invalidConfig = {
        profiles: {
          webdev: {
            description: 'Test',
            targets: [],
          },
        },
      };

      writeFileSync(configPath, JSON.stringify(invalidConfig));

      const result = configService.loadConfig(configPath);

      expect(result.config).toBeNull();
      expect(result.error).toContain('targets array cannot be empty');
    });
  });

  describe('getUserDefinedProfiles', () => {
    it('should return empty object when config is null', () => {
      const profiles = configService.getUserDefinedProfiles(null);

      expect(profiles).toEqual({});
    });

    it('should return empty object when profiles is undefined', () => {
      const config: INpkillrcConfig = {
        targets: ['node_modules'],
      };

      const profiles = configService.getUserDefinedProfiles(config);

      expect(profiles).toEqual({});
    });

    it('should extract user profiles correctly', () => {
      const config: INpkillrcConfig = {
        profiles: {
          webdev: {
            description: 'Web development',
            targets: ['node_modules', 'dist'],
          },
          python: {
            description: 'Python development',
            targets: ['.venv', '__pycache__'],
          },
        },
      };

      const profiles = configService.getUserDefinedProfiles(config);

      expect(Object.keys(profiles).length).toBe(2);
      expect(profiles.webdev).toEqual({
        description: 'Web development',
        targets: ['node_modules', 'dist'],
      });
      expect(profiles.python).toEqual({
        description: 'Python development',
        targets: ['.venv', '__pycache__'],
      });
    });
  });

  describe('mergeConfigs', () => {
    it('should return base config when file config is null', () => {
      const baseConfig = {
        targets: ['node_modules'],
        sortBy: 'none',
      };

      const merged = configService.mergeConfigs(baseConfig, null);

      expect(merged).toEqual(baseConfig);
    });

    it('should merge targets from file config', () => {
      const baseConfig = {
        targets: ['node_modules'],
      };
      const fileConfig: INpkillrcConfig = {
        targets: ['dist', '.venv'],
      };

      const merged = configService.mergeConfigs(baseConfig, fileConfig);

      expect(merged.targets).toEqual(['dist', '.venv']);
    });

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

    it('should override simple properties', () => {
      const baseConfig = {
        sortBy: 'none',
        backgroundColor: 'bgBlue',
        sizeUnit: 'auto',
        dryRun: false,
      };
      const fileConfig: INpkillrcConfig = {
        sortBy: 'size',
        backgroundColor: 'bgCyan',
        sizeUnit: 'mb',
        dryRun: true,
      };

      const merged = configService.mergeConfigs(baseConfig, fileConfig);

      expect(merged.sortBy).toBe('size');
      expect(merged.backgroundColor).toBe('bgCyan');
      expect(merged.sizeUnit).toBe('mb');
      expect(merged.dryRun).toBe(true);
    });

    it('should preserve base config properties not in file config', () => {
      const baseConfig = {
        targets: ['node_modules'],
        sortBy: 'none',
        dryRun: false,
      };
      const fileConfig: INpkillrcConfig = {
        sortBy: 'size',
      };

      const merged = configService.mergeConfigs(baseConfig, fileConfig);

      expect(merged.targets).toEqual(['node_modules']);
      expect(merged.sortBy).toBe('size');
      expect(merged.dryRun).toBe(false);
    });
  });

  describe('integration tests', () => {
    it('should load a complete realistic config file', () => {
      const configPath = join(tempDir, '.npkillrc');
      const realisticConfig: INpkillrcConfig = {
        targets: ['node_modules', '.venv', '__pycache__'],
        exclude: ['.git', 'important-project'],
        sortBy: 'last-mod',
        backgroundColor: 'bgCyan',
        sizeUnit: 'auto',
        excludeHiddenDirectories: false,
        dryRun: false,
        checkUpdates: true,
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

      writeFileSync(configPath, JSON.stringify(realisticConfig, null, 2));

      const result = configService.loadConfig(configPath);

      expect(result.config).not.toBeNull();
      expect(result.error).toBeUndefined();
      expect(result.config?.targets).toEqual([
        'node_modules',
        '.venv',
        '__pycache__',
      ]);
      expect(result.config?.sortBy).toBe('last-mod');
      expect(result.config?.profiles).toBeDefined();

      const userProfiles = configService.getUserDefinedProfiles(result.config);
      expect(Object.keys(userProfiles).length).toBe(2);
      expect(userProfiles.frontend).toBeDefined();
      expect(userProfiles.backend).toBeDefined();
    });
  });
});
