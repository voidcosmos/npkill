import { describe, expect, it } from '@jest/globals';
import type { Profile } from '../../../src/index.js';
import { ProfilesService } from '../../../src/core/services/profiles.service.js';
import {
  cargoTarget,
  mavenTarget,
} from '../../api/support/recognition-contract.js';

describe('profile rule resolution', () => {
  it('preserves complete alternatives for targets with the same name', () => {
    const service = new ProfilesService();
    service.setUserDefinedProfiles({
      cargo: { description: 'Cargo', targets: [cargoTarget] },
      maven: { description: 'Maven', targets: [mavenTarget] },
    } as unknown as Record<string, Profile>);
    expect(service.getTargetsFromProfiles(['cargo', 'maven'])).toEqual([
      cargoTarget,
      mavenTarget,
    ]);
  });

  it('applies profile overrides when resolving all', () => {
    const service = new ProfilesService();
    service.setUserDefinedProfiles({
      node: { description: 'Custom Node', targets: [cargoTarget] },
    } as unknown as Record<string, Profile>);
    const targets = service.getTargetsFromProfiles(['all']);
    expect(targets).toContainEqual(cargoTarget);
    expect(targets).not.toContain('node_modules');
  });
});
