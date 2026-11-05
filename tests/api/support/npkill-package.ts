import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type * as NpkillApi from '../../../src/index.js';

export const PACKAGE_DIR = fileURLToPath(
  new URL('../../../.test-build/npkill-api/', import.meta.url),
);

const { Npkill } = (await import(
  join(PACKAGE_DIR, 'lib', 'index.js')
)) as typeof NpkillApi;

type NpkillInstance = InstanceType<typeof Npkill>;

const createdInstances: NpkillInstance[] = [];

export function createNpkill(): NpkillInstance {
  const npkill = new Npkill();
  createdInstances.push(npkill);
  return npkill;
}

export function stopCreatedInstances(): void {
  createdInstances.splice(0).forEach((npkill) => npkill.stopScan());
}
