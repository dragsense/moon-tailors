import { randomBytes } from "crypto";

/**
 * Generate a strong temporary password.
 * Guarantees at least one letter, digit, and special character.
 */
export function generateStrongPassword(length = 12): string {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const numeric = "23456789";
  const special = "!@#$%^&*";
  const all = alpha + numeric + special;

  const pick = (chars: string) => chars[randomBytes(1)[0]! % chars.length]!;

  const chars = [pick(alpha), pick(numeric), pick(special)];
  for (let i = chars.length; i < length; i += 1) {
    chars.push(pick(all));
  }

  // Fisher–Yates shuffle
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0]! % (i + 1);
    [chars[i], chars[j]] = [chars[j]!, chars[i]!];
  }

  return chars.join("");
}

/** Split a single display name into first / last for UserEntity. */
export function splitDisplayName(name: string): {
  firstName: string;
  lastName: string;
} {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (!trimmed) return { firstName: "User", lastName: "" };
  const parts = trimmed.split(" ");
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "-" };
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}
