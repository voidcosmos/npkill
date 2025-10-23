import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import {
  IConfigLoadResult,
  INpkillrcConfig,
  VALID_NPKILLRC_PROPERTIES,
} from '../interfaces/npkillrc-config.interface.js';
import { PROFILE } from '../interfaces/profile.interface.js';

const DEFAULT_CONFIG_FILENAME = '.npkillrc';
const VALID_SORT_OPTIONS = ['none', 'size', 'path', 'last-mod'] as const;
const VALID_BG_COLORS = [
  'bgBlue',
  'bgCyan',
  'bgMagenta',
  'bgRed',
  'bgWhite',
  'bgYellow',
] as const;
const VALID_SIZE_UNITS = ['auto', 'mb', 'gb'] as const;

/**
 * Service responsible for loading and parsing .npkillrc configuration files.
 */
export class ConfigService {
  /**
   * Loads configuration from the default location (~/.npkillrc) or a custom path.
   * @param customPath Optional custom path to a configuration file
   * @returns Configuration load result containing the parsed config or error information
   */
  loadConfig(customPath?: string): IConfigLoadResult {
    const configPath = customPath
      ? customPath
      : join(homedir(), DEFAULT_CONFIG_FILENAME);

    if (!existsSync(configPath)) {
      return {
        config: null,
        configPath,
        error: customPath
          ? `Custom config file not found: ${configPath}`
          : undefined,
      };
    }

    try {
      const fileContent = readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(fileContent) as INpkillrcConfig;

      const validationError = this.validateConfig(parsedConfig);
      if (!validationError.isValid) {
        return {
          configPath,
          config: null,
          error: validationError.error,
        };
      }

      return {
        config: parsedConfig,
        configPath,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        config: null,
        configPath,
        error: `Failed to parse config file: ${errorMessage}.`,
      };
    }
  }

  private validateConfig(config: INpkillrcConfig): {
    isValid: boolean;
    error?: string;
  } {
    if (typeof config !== 'object' || config === null) {
      return { isValid: false, error: 'Configuration must be an object.' };
    }

    const unknownProps = Object.keys(config).filter(
      (key) =>
        !VALID_NPKILLRC_PROPERTIES.includes(key as keyof INpkillrcConfig),
    );

    if (unknownProps.length > 0) {
      return {
        isValid: false,
        error:
          `Unknown configuration ${unknownProps.length === 1 ? 'property' : 'properties'}:` +
          ` ${unknownProps.join(', ')}. Valid properties are: ${VALID_NPKILLRC_PROPERTIES.join(', ')}.`,
      };
    }

    // Validate targets
    if (config.targets !== undefined) {
      if (!Array.isArray(config.targets)) {
        return {
          isValid: false,
          error: 'targets must be an array of strings.',
        };
      }
      if (!config.targets.every((t) => typeof t === 'string')) {
        return { isValid: false, error: 'All targets must be strings.' };
      }
      if (config.targets.length === 0) {
        return { isValid: false, error: 'Targets array cannot be empty.' };
      }
    }

    // Validate exclude
    if (config.exclude !== undefined) {
      if (!Array.isArray(config.exclude)) {
        return {
          isValid: false,
          error: 'exclude must be an array of strings.',
        };
      }
      if (!config.exclude.every((e) => typeof e === 'string')) {
        return { isValid: false, error: 'All exclude items must be strings.' };
      }
    }

    // Validate sortBy
    if (config.sortBy !== undefined) {
      if (!(VALID_SORT_OPTIONS as readonly string[]).includes(config.sortBy)) {
        return {
          isValid: false,
          error: `sortBy must be one of: ${VALID_SORT_OPTIONS.join(', ')}.`,
        };
      }
    }

    // Validate backgroundColor
    if (config.backgroundColor !== undefined) {
      if (
        !(VALID_BG_COLORS as readonly string[]).includes(config.backgroundColor)
      ) {
        return {
          isValid: false,
          error: `backgroundColor must be one of: ${VALID_BG_COLORS.join(', ')}.`,
        };
      }
    }

    // Validate sizeUnit
    if (config.sizeUnit !== undefined) {
      if (!(VALID_SIZE_UNITS as readonly string[]).includes(config.sizeUnit)) {
        return {
          isValid: false,
          error: `sizeUnit must be one of: ${VALID_SIZE_UNITS.join(', ')}.`,
        };
      }
    }

    // Validate boolean fields
    if (
      config.excludeHiddenDirectories !== undefined &&
      typeof config.excludeHiddenDirectories !== 'boolean'
    ) {
      return {
        isValid: false,
        error: 'excludeHiddenDirectories must be a boolean',
      };
    }

    if (config.dryRun !== undefined && typeof config.dryRun !== 'boolean') {
      return {
        isValid: false,
        error: 'dryRun must be a boolean',
      };
    }

    if (
      config.checkUpdates !== undefined &&
      typeof config.checkUpdates !== 'boolean'
    ) {
      return { isValid: false, error: 'checkUpdates must be a boolean.' };
    }

    // Validate profiles
    if (config.profiles !== undefined) {
      if (
        typeof config.profiles !== 'object' ||
        Array.isArray(config.profiles)
      ) {
        return { isValid: false, error: 'profiles must be an object.' };
      }

      for (const [profileName, profile] of Object.entries(config.profiles)) {
        if (typeof profile !== 'object' || profile === null) {
          return {
            isValid: false,
            error: `Profile "${profileName}" must be an object.`,
          };
        }

        if (!profile.description || typeof profile.description !== 'string') {
          return {
            isValid: false,
            error: `Profile "${profileName}" must have a description property (string).`,
          };
        }

        if (!profile.targets) {
          return {
            isValid: false,
            error: `Profile "${profileName}" must have a targets property.`,
          };
        }

        if (!Array.isArray(profile.targets)) {
          return {
            isValid: false,
            error: `Profile "${profileName}" targets must be an array of strings.`,
          };
        }

        if (!profile.targets.every((t) => typeof t === 'string')) {
          return {
            isValid: false,
            error: `All targets in profile "${profileName}" must be strings.`,
          };
        }

        if (profile.targets.length === 0) {
          return {
            isValid: false,
            error: `Profile "${profileName}" targets array cannot be empty.`,
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Merges configuration from .npkillrc with a base configuration.
   * Config file values take precedence over base values.
   * @param baseConfig Base configuration object
   * @param fileConfig Configuration loaded from .npkillrc
   * @returns Merged configuration
   */
  mergeConfigs<T extends Record<string, unknown>>(
    baseConfig: T,
    fileConfig: INpkillrcConfig | null,
  ): T {
    if (!fileConfig) {
      return baseConfig;
    }

    const merged = { ...baseConfig };

    // Merge simple properties
    if (fileConfig.targets !== undefined) {
      (merged as Record<string, unknown>).targets = fileConfig.targets;
    }

    if (fileConfig.exclude !== undefined) {
      // Merge exclude arrays, avoiding duplicates
      const baseExclude = Array.isArray(
        (baseConfig as Record<string, unknown>).exclude,
      )
        ? ((baseConfig as Record<string, unknown>).exclude as string[])
        : [];
      (merged as Record<string, unknown>).exclude = [
        ...new Set([...baseExclude, ...fileConfig.exclude]),
      ];
    }

    if (fileConfig.sortBy !== undefined) {
      (merged as Record<string, unknown>).sortBy = fileConfig.sortBy;
    }

    if (fileConfig.backgroundColor !== undefined) {
      (merged as Record<string, unknown>).backgroundColor =
        fileConfig.backgroundColor;
    }

    if (fileConfig.sizeUnit !== undefined) {
      (merged as Record<string, unknown>).sizeUnit = fileConfig.sizeUnit;
    }

    if (fileConfig.excludeHiddenDirectories !== undefined) {
      (merged as Record<string, unknown>).excludeHiddenDirectories =
        fileConfig.excludeHiddenDirectories;
    }

    if (fileConfig.dryRun !== undefined) {
      (merged as Record<string, unknown>).dryRun = fileConfig.dryRun;
    }

    if (fileConfig.checkUpdates !== undefined) {
      (merged as Record<string, unknown>).checkUpdates =
        fileConfig.checkUpdates;
    }

    return merged;
  }

  /**
   * Gets custom profiles from the configuration file.
   * @param config Configuration loaded from .npkillrc
   * @returns Record of user-defined profiles
   */
  getUserDefinedProfiles(
    config: INpkillrcConfig | null,
  ): Record<string, PROFILE> {
    if (!config || !config.profiles) {
      return {};
    }

    return config.profiles;
  }
}
