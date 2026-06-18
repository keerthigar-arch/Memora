/** API timestamps are UTC; older responses may omit the trailing Z. */
export function parseApiUtcDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  const raw = value.trim();
  if (!raw) return new Date(NaN);
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(raw)) return new Date(raw);
  return new Date(`${raw}Z`);
}
