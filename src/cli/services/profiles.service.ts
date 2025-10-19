import { DEFAULT_PROFILES } from '../../constants/index.js';
import colors from 'colors';

export class ProfilesService {
  getAvailableProfilesToPrint(defaultProfileName?: string): string {
    return DEFAULT_PROFILES.reduce((acc, profile) => {
      const isDefault = profile.name === defaultProfileName;
      const entry =
        ` ${colors.green(profile.name)}${isDefault ? colors.italic(' (default)') : ''} - ${profile.description}\n` +
        colors.gray(` ${profile.targets.join(colors.italic(','))}\n\n`);
      return acc + entry;
    }, '');
  }

  /** Return an array of invalid profile names (if not exist or dont have targets). */
  getBadProfiles(profilesNames: string[]): string[] {
    const availableProfilesNames = DEFAULT_PROFILES.map(
      (profile) => profile.name,
    );
    return profilesNames.filter(
      (profileName) => !availableProfilesNames.includes(profileName),
    );
  }

  getTargetsFromProfiles(profilesNames: string[]): string[] {
    const profileMap = new Map(DEFAULT_PROFILES.map((p) => [p.name, p]));
    const targets = new Set<string>();

    for (const name of profilesNames) {
      const profile = profileMap.get(name);
      if (!profile) {
        continue;
      }

      for (const target of profile.targets) {
        targets.add(target);
      }
    }

    return Array.from(targets);
  }
}
