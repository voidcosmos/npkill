import { ProfilesService } from '../../../src/cli/services/profiles.service.js';
import { DEFAULT_PROFILES } from '../../../src/constants/profiles.constants.js';

describe('ProfilesService', () => {
  let profilesService: ProfilesService;

  beforeEach(() => {
    profilesService = new ProfilesService();
  });

  describe('getAvailableProfilesToPrint', () => {
    it('should return a formatted string with all available profiles', () => {
      const result = profilesService.getAvailableProfilesToPrint();

      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');

      DEFAULT_PROFILES.forEach((profile) => {
        expect(result).toContain(profile.name);
        expect(result).toContain(profile.description);
      });
    });

    it('should mark the specified profile as default', () => {
      const defaultProfile = 'python';
      const result =
        profilesService.getAvailableProfilesToPrint(defaultProfile);

      expect(result).toContain('python');
      expect(result).toContain('(default)');
    });

    it('should mark "node" as default when specified', () => {
      const result = profilesService.getAvailableProfilesToPrint('node');

      expect(result).toContain('node');

      const nodeSection = result
        .split('\n')
        .find((line) => line.includes('node'));
      expect(nodeSection).toContain('(default)');
    });

    it('should not mark any profile as default when no default is specified', () => {
      const result = profilesService.getAvailableProfilesToPrint();

      expect(result).not.toContain('(default)');
    });

    it('should include profile targets in the output', () => {
      const result = profilesService.getAvailableProfilesToPrint();

      expect(result).toContain('node_modules');
      expect(result).toContain('__pycache__');
    });

    it('should return empty string when no profiles exist', () => {
      const originalProfiles = [...DEFAULT_PROFILES];
      DEFAULT_PROFILES.length = 0;

      const result = profilesService.getAvailableProfilesToPrint();

      expect(result).toBe('');

      DEFAULT_PROFILES.push(...originalProfiles);
    });
  });

  describe('getBadProfiles', () => {
    it('should return empty array when all profiles are valid', () => {
      const validProfiles = ['node', 'python', 'java'];
      const result = profilesService.getBadProfiles(validProfiles);

      expect(result).toEqual([]);
    });

    it('should return array with invalid profile names', () => {
      const profiles = ['node', 'invalid-profile', 'python', 'nonexistent'];
      const result = profilesService.getBadProfiles(profiles);

      expect(result).toEqual(['invalid-profile', 'nonexistent']);
    });

    it('should return all profiles when none are valid', () => {
      const invalidProfiles = ['fake1', 'fake2', 'fake3'];
      const result = profilesService.getBadProfiles(invalidProfiles);

      expect(result).toEqual(invalidProfiles);
    });

    it('should return empty array for empty input', () => {
      const result = profilesService.getBadProfiles([]);

      expect(result).toEqual([]);
    });

    it('should be case-sensitive', () => {
      const profiles = ['Node', 'PYTHON', 'node'];
      const result = profilesService.getBadProfiles(profiles);

      expect(result).toEqual(['Node', 'PYTHON']);
    });

    it('should handle profiles with special characters', () => {
      const profiles = ['node', 'python!', 'java@'];
      const result = profilesService.getBadProfiles(profiles);

      expect(result).toEqual(['python!', 'java@']);
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
      const allProfileNames = DEFAULT_PROFILES.map((p) => p.name).filter(
        (name) => name !== 'all',
      );
      const result = profilesService.getTargetsFromProfiles(allProfileNames);

      expect(result.length).toBeGreaterThan(0);

      expect(result).toContain('node_modules');
      expect(result).toContain('__pycache__');
    });
  });

  describe('Integration tests', () => {
    it('should only return valid targets when mixing valid and invalid profiles', () => {
      const badProfiles = profilesService.getBadProfiles([
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

    it('should handle workflow of listing profiles and getting targets', () => {
      const profilesList = profilesService.getAvailableProfilesToPrint('node');
      expect(profilesList).toContain('node');
      expect(profilesList).toContain('(default)');

      const badProfiles = profilesService.getBadProfiles([
        'node',
        'invalid',
        'python',
      ]);
      expect(badProfiles).toEqual(['invalid']);

      const targets = profilesService.getTargetsFromProfiles([
        'node',
        'python',
      ]);
      expect(targets.length).toBeGreaterThan(0);
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

    it('should handle very long profile lists', () => {
      const allProfiles = DEFAULT_PROFILES.map((p) => p.name);
      const longList = [...allProfiles, ...allProfiles, ...allProfiles];

      const result = profilesService.getTargetsFromProfiles(longList);

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return consistent results for multiple calls', () => {
      const profiles = ['node', 'python', 'java'];

      const result1 = profilesService.getTargetsFromProfiles(profiles);
      const result2 = profilesService.getTargetsFromProfiles(profiles);
      const result3 = profilesService.getTargetsFromProfiles(profiles);

      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });
});
