import { ProfilesService } from '../../../src/core/services/profiles.service.js';
import { DEFAULT_PROFILES } from '../../../src/core/constants/profiles.constants.js';
import { Profile } from '../../../src/core/interfaces/profile.interface.js';
import { validateTargets } from '../../../src/core/services/targets/index.js';
import {
  cargoTarget,
  mavenTarget,
} from '../../api/support/recognition-contract.js';

describe('ProfilesService', () => {
  let profilesService: ProfilesService;

  beforeEach(() => {
    profilesService = new ProfilesService();
  });

  describe('setUserDefinedProfiles', () => {
    it('should override previous user-defined profiles', () => {
      const firstProfiles: Record<string, Profile> = {
        first: { description: 'First', targets: ['first'] },
      };
      const secondProfiles: Record<string, Profile> = {
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

    it('should return base and user profiles when filterType is "all", with user profiles overriding base ones', () => {
      profilesService.setUserDefinedProfiles({
        custom: {
          description: 'Custom profile',
          targets: ['custom_modules'],
        },
        node: {
          description: 'Custom Node profile',
          targets: ['custom_node_modules'],
        },
      });

      const result = profilesService.getProfiles('all');

      expect(result['python']).toBeDefined();
      expect(result['custom']).toBeDefined();
      expect(result['node'].description).toBe('Custom Node profile');
      expect(result['node'].targets).toEqual(['custom_node_modules']);
    });
  });

  describe('getInvalidProfileNames', () => {
    it('should return array with invalid profile names', () => {
      const profiles = ['node', 'invalid-profile', 'python', 'nonexistent'];
      const result = profilesService.getInvalidProfileNames(profiles);

      expect(result).toEqual(['invalid-profile', 'nonexistent']);
    });

    it('should recognize user-defined profiles as valid', () => {
      const userProfiles: Record<string, Profile> = {
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
    it('should return targets for multiple profiles', () => {
      const result = profilesService.getTargetsFromProfiles(['node', 'python']);

      expect(result).toContain('node_modules');
      expect(result).toContain('__pycache__');
    });

    it('should reject mixed selections instead of returning partial targets', () => {
      expect(() =>
        profilesService.getTargetsFromProfiles([
          'node',
          'invalid-profile',
          'python',
        ]),
      ).toThrow('invalid-profile');
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

    it('should allow user profiles to override base profiles in target resolution', () => {
      const userProfiles: Record<string, Profile> = {
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

    it('keeps every rule that shares a name', () => {
      profilesService.setUserDefinedProfiles({
        cargo: { description: 'Cargo', targets: [cargoTarget] },
        maven: { description: 'Maven', targets: [mavenTarget] },
      });

      expect(
        profilesService.getTargetsFromProfiles(['cargo', 'maven']),
      ).toEqual([cargoTarget, mavenTarget]);
    });

    it('applies profile overrides when resolving all', () => {
      profilesService.setUserDefinedProfiles({
        node: { description: 'Custom Node', targets: [cargoTarget] },
      });

      const targets = profilesService.getTargetsFromProfiles(['all']);

      expect(targets).toContainEqual(cargoTarget);
      expect(targets).not.toContain('node_modules');
    });
  });

  describe('getDefaultProfileName', () => {
    it('should return "node" as the default profile name', () => {
      const result = profilesService.getDefaultProfileName();

      expect(result).toBe('node');
    });
  });

  describe('default profiles', () => {
    it.each(Object.entries(DEFAULT_PROFILES))(
      'ships the %s profile with valid targets',
      (name, profile) => {
        expect(validateTargets(profile.targets, name)).toEqual({
          isValid: true,
        });
      },
    );
  });
});
