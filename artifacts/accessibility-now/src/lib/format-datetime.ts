/** Fixed locale so server-rendered dates match client hydration. */
const DISPLAY_LOCALE = "en-GB";

export function formatDateTime(value: string | number | Date): string {
  return new Date(value).toLocaleString(DISPLAY_LOCALE, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDateShort(value: string | number | Date): string {
  return new Date(value).toLocaleDateString(DISPLAY_LOCALE, {
    month: "short",
    day: "numeric",
  });
}
