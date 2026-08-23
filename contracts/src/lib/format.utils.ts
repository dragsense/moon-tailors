/** Shared string helpers used by API and UI. */

export function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function toTitleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => capitalize(part.toLowerCase()))
    .join(" ");
}

export function truncate(value: string, max = 120): string {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1))}…`;
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
