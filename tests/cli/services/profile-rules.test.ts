import { describe, expect, it } from '@jest/globals';
import { ProfilesService } from '../../../src/core/services/profiles.service.js';
import { DEFAULT_PROFILES } from '../../../src/core/constants/profiles.constants.js';
import { validateTargets } from '../../../src/core/services/targets/index.js';
import {
  cargoTarget,
  mavenTarget,
} from '../../api/support/recognition-contract.js';

describe('profile rule resolution', () => {
  it('keeps every rule that shares a name', () => {
    const service = new ProfilesService();
    service.setUserDefinedProfiles({
      cargo: { description: 'Cargo', targets: [cargoTarget] },
      maven: { description: 'Maven', targets: [mavenTarget] },
    });
    expect(service.getTargetsFromProfiles(['cargo', 'maven'])).toEqual([
      cargoTarget,
      mavenTarget,
    ]);
  });

  it('applies profile overrides when resolving all', () => {
    const service = new ProfilesService();
    service.setUserDefinedProfiles({
      node: { description: 'Custom Node', targets: [cargoTarget] },
    });
    const targets = service.getTargetsFromProfiles(['all']);
    expect(targets).toContainEqual(cargoTarget);
    expect(targets).not.toContain('node_modules');
  });

  it.each(Object.entries(DEFAULT_PROFILES))(
    'ships the %s profile with valid targets',
    (name, profile) => {
      expect(validateTargets(profile.targets, name)).toEqual({ isValid: true });
    },
  );
});
