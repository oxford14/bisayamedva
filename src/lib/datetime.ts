export const APP_TIMEZONE = "Asia/Manila";

function partValue(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

/** Wall-clock `YYYY-MM-DDTHH:mm` in `timeZone` → UTC ISO for timestamptz. */
export function datetimeLocalToIso(
  local: string,
  timeZone = APP_TIMEZONE,
): string {
  const normalized = local.length === 16 ? `${local}:00` : local;
  if (timeZone === APP_TIMEZONE) {
    const instant = new Date(`${normalized}+08:00`);
    if (Number.isNaN(instant.getTime())) {
      throw new Error("Invalid session date.");
    }
    return instant.toISOString();
  }

  const match = normalized.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/,
  );
  if (!match) throw new Error("Invalid session date.");

  const [, year, month, day, hour, minute, second] = match;
  const asUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  const guess = new Date(asUtc);
  const shown = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(guess);
  const shownAsUtc = Date.UTC(
    Number(partValue(shown, "year")),
    Number(partValue(shown, "month")) - 1,
    Number(partValue(shown, "day")),
    Number(partValue(shown, "hour")),
    Number(partValue(shown, "minute")),
    Number(partValue(shown, "second")),
  );
  const instant = new Date(asUtc - (shownAsUtc - asUtc));
  if (Number.isNaN(instant.getTime())) {
    throw new Error("Invalid session date.");
  }
  return instant.toISOString();
}

export function isoToDatetimeLocal(
  iso: string,
  timeZone = APP_TIMEZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  return `${partValue(parts, "year")}-${partValue(parts, "month")}-${partValue(parts, "day")}T${partValue(parts, "hour")}:${partValue(parts, "minute")}`;
}

export function addMinutesToDatetimeLocal(
  value: string,
  minutes: number,
  timeZone = APP_TIMEZONE,
): string {
  const start = new Date(datetimeLocalToIso(value, timeZone));
  const end = new Date(start.getTime() + minutes * 60_000);
  return isoToDatetimeLocal(end.toISOString(), timeZone);
}

export function formatSessionWhenLabel(
  startsAt: string,
  endsAt?: string | null,
  timeZone?: string | null,
): string {
  const tz = timeZone || APP_TIMEZONE;
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const date = start.toLocaleDateString("en-PH", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: tz,
  });
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  };
  const startTime = start.toLocaleTimeString("en-PH", timeOpts);
  const endTime = end ? end.toLocaleTimeString("en-PH", timeOpts) : null;
  const tzLabel = tz;
  return endTime
    ? `${date} · ${startTime} – ${endTime} · ${tzLabel}`
    : `${date} · ${startTime} · ${tzLabel}`;
}
