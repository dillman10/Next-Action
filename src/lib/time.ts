const MAX_MINUTES = 24 * 60 * 30; // 30 days

/**
 * Parses time from either a string (e.g. "45m", "2h") or a number (minutes).
 * Returns null if invalid. Cap at MAX_MINUTES.
 */
export function parseTimeInputOrNumber(
  input: string | number | null | undefined,
): number | null {
  if (input == null || input === "") return null;
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input <= 0) return null;
    const capped = Math.min(Math.round(input), MAX_MINUTES);
    return capped > 0 ? capped : null;
  }
  return parseTimeInput(String(input));
}

/**
 * Parses flexible time input (e.g. 45m, 2h, 1d) to minutes.
 * Returns null if invalid. Cap at MAX_MINUTES.
 */
export function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const numMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*([mhd]|min|mins|hour|hours|hr|hrs|day|days)?$/);
  if (!numMatch) return null;

  const value = parseFloat(numMatch[1]);
  if (!Number.isFinite(value) || value <= 0) return null;

  const unit = numMatch[2] ?? "m";
  let minutes: number;
  switch (unit) {
    case "m":
    case "min":
    case "mins":
      minutes = value;
      break;
    case "h":
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
      minutes = value * 60;
      break;
    case "d":
    case "day":
    case "days":
      minutes = value * 60 * 24;
      break;
    default:
      return null;
  }

  const capped = Math.min(Math.round(minutes), MAX_MINUTES);
  return capped > 0 ? capped : null;
}

/**
 * Human-readable time from minutes (e.g. 300 → "5h", 90 → "1h 30m").
 */
export function formatTimeMinutes(totalMinutes: number): string {
  if (totalMinutes < 0 || !Number.isFinite(totalMinutes)) return "0m";
  const m = Math.round(totalMinutes);
  if (m < 60) return `${m}m`;
  const hours = Math.floor(m / 60);
  const mins = m % 60;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
