import { ProfilesService } from '../../../src/core/services/profiles.service.js';
import { DEFAULT_PROFILES } from '../../../src/core/constants/profiles.constants.js';
import { PROFILE } from '../../../src/core/interfaces/profile.interface.js';

describe('ProfilesService', () => {
  let profilesService: ProfilesService;

  beforeEach(() => {
    profilesService = new ProfilesService();
  });

  describe('setUserDefinedProfiles', () => {
    it('should set user-defined profiles', () => {
      const userProfiles: Record<string, PROFILE> = {
        custom: {
          description: 'Custom profile for testing',
          targets: ['custom_modules', 'custom_cache'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);
      const result = profilesService.getProfiles('user');

      expect(result).toEqual(userProfiles);
    });

    it('should override previous user-defined profiles', () => {
      const firstProfiles: Record<string, PROFILE> = {
        first: { description: 'First', targets: ['first'] },
      };
      const secondProfiles: Record<string, PROFILE> = {
        second: { description: 'Second', targets: ['second'] },
      };

      profilesService.setUserDefinedProfiles(firstProfiles);
      profilesService.setUserDefinedProfiles(secondProfiles);
      const result = profilesService.getProfiles('user');

      expect(result).toEqual(secondProfiles);
      expect(result['first']).toBeUndefined();
      expect(result['second']).toBeDefined();
    });
  });

  describe('getProfiles', () => {
    it('should return base profiles when filterType is "base"', () => {
      const result = profilesService.getProfiles('base');

      expect(result).toEqual(DEFAULT_PROFILES);
      expect(result['node']).toBeDefined();
      expect(result['python']).toBeDefined();
    });

    it('should return user profiles when filterType is "user"', () => {
      const userProfiles: Record<string, PROFILE> = {
        custom: {
          description: 'Custom profile',
          targets: ['custom_modules'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);
      const result = profilesService.getProfiles('user');

      expect(result).toEqual(userProfiles);
      expect(result['custom']).toBeDefined();
    });

    it('should return all profiles when filterType is "all"', () => {
      const userProfiles: Record<string, PROFILE> = {
        custom: {
          description: 'Custom profile',
          targets: ['custom_modules'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);
      const result = profilesService.getProfiles('all');

      expect(result['node']).toBeDefined();
      expect(result['python']).toBeDefined();
      expect(result['custom']).toBeDefined();
    });

    it('should default to "all" when no filterType is provided', () => {
      const result = profilesService.getProfiles();

      expect(result).toEqual(DEFAULT_PROFILES);
    });

    it('should allow user profiles to override base profiles', () => {
      const userProfiles: Record<string, PROFILE> = {
        node: {
          description: 'Custom Node profile',
          targets: ['custom_node_modules'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);
      const result = profilesService.getProfiles('all');

      expect(result['node'].description).toBe('Custom Node profile');
      expect(result['node'].targets).toEqual(['custom_node_modules']);
    });
  });

  describe('getProfileByName', () => {
    it('should return a base profile by name', () => {
      const result = profilesService.getProfileByName('node');

      expect(result).toBeDefined();
      expect(result?.targets).toContain('node_modules');
    });

    it('should return a user-defined profile by name', () => {
      const userProfiles: Record<string, PROFILE> = {
        custom: {
          description: 'Custom profile',
          targets: ['custom_modules'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);
      const result = profilesService.getProfileByName('custom');

      expect(result).toBeDefined();
      expect(result?.targets).toEqual(['custom_modules']);
    });

    it('should prioritize user-defined profiles over base profiles', () => {
      const userProfiles: Record<string, PROFILE> = {
        node: {
          description: 'Custom Node profile',
          targets: ['custom_node_modules'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);
      const result = profilesService.getProfileByName('node');

      expect(result?.description).toBe('Custom Node profile');
      expect(result?.targets).toEqual(['custom_node_modules']);
    });

    it('should return undefined for non-existent profiles', () => {
      const result = profilesService.getProfileByName('nonexistent');

      expect(result).toBeUndefined();
    });
  });

  describe('hasProfile', () => {
    it('should return true for existing base profiles', () => {
      expect(profilesService.hasProfile('node')).toBe(true);
      expect(profilesService.hasProfile('python')).toBe(true);
    });

    it('should return true for existing user-defined profiles', () => {
      const userProfiles: Record<string, PROFILE> = {
        custom: {
          description: 'Custom profile',
          targets: ['custom_modules'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);

      expect(profilesService.hasProfile('custom')).toBe(true);
    });

    it('should return false for non-existent profiles', () => {
      expect(profilesService.hasProfile('nonexistent')).toBe(false);
    });
  });

  describe('getInvalidProfileNames', () => {
    it('should return empty array when all profiles are valid', () => {
      const validProfiles = ['node', 'python', 'java'];
      const result = profilesService.getInvalidProfileNames(validProfiles);

      expect(result).toEqual([]);
    });

    it('should return array with invalid profile names', () => {
      const profiles = ['node', 'invalid-profile', 'python', 'nonexistent'];
      const result = profilesService.getInvalidProfileNames(profiles);

      expect(result).toEqual(['invalid-profile', 'nonexistent']);
    });

    it('should return all profiles when none are valid', () => {
      const invalidProfiles = ['fake1', 'fake2', 'fake3'];
      const result = profilesService.getInvalidProfileNames(invalidProfiles);

      expect(result).toEqual(invalidProfiles);
    });

    it('should return empty array for empty input', () => {
      const result = profilesService.getInvalidProfileNames([]);

      expect(result).toEqual([]);
    });

    it('should be case-sensitive', () => {
      const profiles = ['Node', 'PYTHON', 'node'];
      const result = profilesService.getInvalidProfileNames(profiles);

      expect(result).toEqual(['Node', 'PYTHON']);
    });

    it('should handle profiles with special characters', () => {
      const profiles = ['node', 'python!', 'java@'];
      const result = profilesService.getInvalidProfileNames(profiles);

      expect(result).toEqual(['python!', 'java@']);
    });

    it('should recognize user-defined profiles as valid', () => {
      const userProfiles: Record<string, PROFILE> = {
        custom: {
          description: 'Custom profile',
          targets: ['custom_modules'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);
      const result = profilesService.getInvalidProfileNames(['node', 'custom']);

      expect(result).toEqual([]);
    });
  });

  describe('getTargetsFromProfiles', () => {
    it('should return targets for a single profile', () => {
      const result = profilesService.getTargetsFromProfiles(['node']);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('node_modules');
      expect(result).toContain('.npm');
    });

    it('should return targets for multiple profiles', () => {
      const result = profilesService.getTargetsFromProfiles(['node', 'python']);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);

      expect(result).toContain('node_modules');

      expect(result).toContain('__pycache__');
      expect(result).toContain('.pytest_cache');
    });

    it('should remove duplicate targets from multiple profiles', () => {
      const result = profilesService.getTargetsFromProfiles(['node', 'python']);

      const uniqueTargets = [...new Set(result)];
      expect(result.length).toBe(uniqueTargets.length);
    });

    it('should return empty array for invalid profile names', () => {
      const result = profilesService.getTargetsFromProfiles([
        'invalid-profile',
      ]);

      expect(result).toEqual([]);
    });

    it('should return empty array for empty input', () => {
      const result = profilesService.getTargetsFromProfiles([]);

      expect(result).toEqual([]);
    });

    it('should skip invalid profiles and return targets from valid ones', () => {
      const result = profilesService.getTargetsFromProfiles([
        'node',
        'invalid-profile',
        'python',
      ]);

      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('node_modules');
      expect(result).toContain('__pycache__');
    });

    it('should handle the "all" profile correctly', () => {
      const allProfileResult = profilesService.getTargetsFromProfiles(['all']);
      const nodeResult = profilesService.getTargetsFromProfiles(['node']);
      const pythonResult = profilesService.getTargetsFromProfiles(['python']);

      expect(allProfileResult.length).toBeGreaterThan(nodeResult.length);
      expect(allProfileResult.length).toBeGreaterThan(pythonResult.length);

      expect(allProfileResult).toContain('node_modules');
      expect(allProfileResult).toContain('__pycache__');
    });

    it('should maintain target uniqueness when using "all" profile with other profiles', () => {
      const result = profilesService.getTargetsFromProfiles([
        'all',
        'node',
        'python',
      ]);

      const uniqueTargets = [...new Set(result)];
      expect(result.length).toBe(uniqueTargets.length);
    });

    it('should return targets in a consistent order for the same input', () => {
      const result1 = profilesService.getTargetsFromProfiles([
        'node',
        'python',
      ]);
      const result2 = profilesService.getTargetsFromProfiles([
        'node',
        'python',
      ]);

      expect(result1).toEqual(result2);
    });

    it('should handle profile names with different order', () => {
      const result1 = profilesService.getTargetsFromProfiles([
        'node',
        'python',
      ]);
      const result2 = profilesService.getTargetsFromProfiles([
        'python',
        'node',
      ]);

      expect(result1.sort()).toEqual(result2.sort());
    });

    it('should handle all available profiles', () => {
      const allProfileNames = Object.keys(DEFAULT_PROFILES).filter(
        (name) => name !== 'all',
      );
      const result = profilesService.getTargetsFromProfiles(allProfileNames);

      expect(result.length).toBeGreaterThan(0);

      expect(result).toContain('node_modules');
      expect(result).toContain('__pycache__');
    });
  });

  describe('getDefaultProfileName', () => {
    it('should return "node" as the default profile name', () => {
      const result = profilesService.getDefaultProfileName();

      expect(result).toBe('node');
    });
  });

  describe('Integration tests', () => {
    it('should only return valid targets when mixing valid and invalid profiles', () => {
      const badProfiles = profilesService.getInvalidProfileNames([
        'node',
        'fake-profile',
        'python',
      ]);
      const validProfiles = ['node', 'fake-profile', 'python'].filter(
        (p) => !badProfiles.includes(p),
      );
      const targets = profilesService.getTargetsFromProfiles(validProfiles);

      expect(badProfiles).toEqual(['fake-profile']);
      expect(targets.length).toBeGreaterThan(0);
      expect(targets).toContain('node_modules');
      expect(targets).toContain('__pycache__');
    });

    it('should handle workflow of managing profiles and getting targets', () => {
      const userProfiles: Record<string, PROFILE> = {
        custom: {
          description: 'Custom profile',
          targets: ['custom_modules', 'custom_cache'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);

      const badProfiles = profilesService.getInvalidProfileNames([
        'node',
        'invalid',
        'custom',
      ]);
      expect(badProfiles).toEqual(['invalid']);

      const targets = profilesService.getTargetsFromProfiles([
        'node',
        'custom',
      ]);
      expect(targets.length).toBeGreaterThan(0);
      expect(targets).toContain('node_modules');
      expect(targets).toContain('custom_modules');
    });

    it('should allow user profiles to override base profiles in target resolution', () => {
      const userProfiles: Record<string, PROFILE> = {
        node: {
          description: 'Custom Node',
          targets: ['my_custom_modules'],
        },
      };

      profilesService.setUserDefinedProfiles(userProfiles);
      const targets = profilesService.getTargetsFromProfiles(['node']);

      expect(targets).toEqual(['my_custom_modules']);
      expect(targets).not.toContain('node_modules');
    });
  });

  describe('Edge cases', () => {
    it('should handle duplicate profile names in input', () => {
      const result = profilesService.getTargetsFromProfiles([
        'node',
        'node',
        'python',
        'python',
      ]);

      const uniqueTargets = [...new Set(result)];
      expect(result.length).toBe(uniqueTargets.length);
    });

    it('should return consistent results for multiple calls', () => {
      const profiles = ['node', 'python', 'java'];

      const result1 = profilesService.getTargetsFromProfiles(profiles);
      const result2 = profilesService.getTargetsFromProfiles(profiles);
      const result3 = profilesService.getTargetsFromProfiles(profiles);
      const result4 = profilesService.getTargetsFromProfiles(profiles);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
      expect(result3).toEqual(result4);
    });
  });
});
