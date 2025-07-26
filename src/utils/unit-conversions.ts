export function convertBytesToKB(bytes: number): number {
  const factorBytestoKB = 1024;
  return bytes / factorBytestoKB;
}

export function convertBytesToGb(bytes: number): number {
  return bytes / Math.pow(1024, 3);
}

export function convertGBToMB(gb: number): number {
  const factorGBtoMB = 1024;
  return gb * factorGBtoMB;
}
