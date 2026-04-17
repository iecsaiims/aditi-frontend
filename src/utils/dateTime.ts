const IST_TIME_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kolkata',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const IST_DATE_DISPLAY_FORMATTER = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const IST_DATE_FILTER_FORMATTER = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Kolkata',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function parseDate(timestamp: string) {
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatIstTime(timestamp: string, fallback = '') {
  const date = parseDate(timestamp);
  return date ? IST_TIME_FORMATTER.format(date) : fallback;
}

export function formatIstDate(timestamp: string, fallback = '') {
  const date = parseDate(timestamp);
  return date ? IST_DATE_DISPLAY_FORMATTER.format(date) : fallback;
}

export function formatIstDateFilterValue(timestamp: string, fallback = '') {
  const date = parseDate(timestamp);
  return date ? IST_DATE_FILTER_FORMATTER.format(date) : fallback;
}

export function istTimeToMinutes(timestamp: string) {
  const formatted = formatIstTime(timestamp);
  if (!formatted) return -1;

  const [hours, minutes] = formatted.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return -1;

  return hours * 60 + minutes;
}
