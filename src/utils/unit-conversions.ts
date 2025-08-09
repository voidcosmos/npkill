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

export interface FormattedSize {
  value: number;
  unit: 'MB' | 'GB';
  text: string;
}

export function formatSize(
  sizeInGB: number,
  sizeUnit: 'auto' | 'mb' | 'gb',
  decimals = 2,
): FormattedSize {
  let value: number;
  let unit: 'MB' | 'GB';

  if (sizeUnit === 'gb') {
    value = sizeInGB;
    unit = 'GB';
  } else if (sizeUnit === 'mb') {
    value = convertGBToMB(sizeInGB);
    unit = 'MB';
  } else {
    // auto
    const sizeInMB = convertGBToMB(sizeInGB);
    if (sizeInMB < 1024) {
      value = sizeInMB;
      unit = 'MB';
    } else {
      value = sizeInGB;
      unit = 'GB';
    }
  }

  // For MB, round to no use decimals.
  // For GB, use specified decimals.
  let formattedValue: string;
  if (unit === 'MB') {
    formattedValue = Math.round(value).toString();
  } else {
    formattedValue = value.toFixed(decimals);
  }

  const text = `${formattedValue} ${unit}`;

  return { value, unit, text };
}
