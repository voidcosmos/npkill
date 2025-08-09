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

export function convertGbToKb(gb: number): number {
  const factorGBtoKB = 1024 * 1024;
  return gb * factorGBtoKB;
}

export function convertGbToBytes(gb: number): number {
  return gb * Math.pow(1024, 3);
}
