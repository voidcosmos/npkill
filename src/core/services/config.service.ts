import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import {
  IConfigLoadResult,
  INpkillrcConfig,
} from '../interfaces/npkillrc-config.interface.js';
import { PROFILE } from '../interfaces/profile.interface.js';
import { validateConfig, applyFileConfigProperties } from './config/index.js';

const DEFAULT_CONFIG_FILENAME = '.npkillrc';

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

      const validationResult = validateConfig(parsedConfig);
      if (!validationResult.isValid) {
        return {
          configPath,
          config: null,
          error: validationResult.error,
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
    applyFileConfigProperties(
      merged as Record<string, unknown>,
      baseConfig as Record<string, unknown>,
      fileConfig,
    );

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
