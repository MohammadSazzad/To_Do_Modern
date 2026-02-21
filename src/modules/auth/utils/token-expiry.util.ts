import type { StringValue } from 'ms';

export const resolveJwtExpiresIn = (
  value: string | undefined,
  fallback: string,
): number | StringValue => {
  if (!value) {
    return fallback as StringValue;
  }

  const trimmed = value.trim();
  const asNumber = Number(trimmed);

  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber;
  }

  return (trimmed || fallback) as StringValue;
};
