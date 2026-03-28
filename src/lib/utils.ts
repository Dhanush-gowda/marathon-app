export type ClassValue = string | undefined | null | false | ClassValue[];

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatTime(interval: string): string {
  if (!interval) return "—";
  const match = interval.match(/(\d+):(\d+):(\d+)/);
  if (!match) return interval;
  const [, h, m, s] = match;
  return `${h}h ${m}m ${s}s`;
}

export function parseCSVTime(time: string): string {
  const trimmed = time.trim();
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
  return trimmed;
}

export const CATEGORIES = [
  "RBA Warrior 5K",
  "RBA Warrior 3K",
] as const;

export type Category = (typeof CATEGORIES)[number];

const CATEGORY_ALIASES: Record<string, Category> = {
  "RBA Warrior 5K": "RBA Warrior 5K",
  "RBA Warrior 3K": "RBA Warrior 3K",
  "5K Run": "RBA Warrior 5K",
  "3K Run": "RBA Warrior 3K",
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  categories?: string | null;
  bib_number: string | null;
  checkin_status: boolean;
  created_at: string;
}

export interface Result {
  id: string;
  user_id: string;
  finish_time: string;
  rank: number | null;
  created_at: string;
  users?: User;
}

export interface TicketParticipant {
  id: string;
  name: string;
  email: string;
  category: string;
  bib_number: string | null;
}

export function normalizeCategories(input: string | string[] | null | undefined): Category[] {
  const rawValues = Array.isArray(input)
    ? input
    : typeof input === "string"
      ? input.split(",")
      : [];

  const normalized = rawValues
    .map((value) => value.trim())
    .map((value) => CATEGORY_ALIASES[value])
    .filter((value): value is Category => Boolean(value));

  return Array.from(new Set(normalized));
}

export function formatCategories(input: string | string[] | null | undefined): string | null {
  const normalized = normalizeCategories(input);
  return normalized.length > 0 ? normalized.join(",") : null;
}

export function getPrimaryCategory(input: string | string[] | null | undefined): string {
  return normalizeCategories(input)[0] || "Unassigned";
}

export function getParticipantCategoryLabel(participant: {
  category?: string | null;
  categories?: string | null;
}): string {
  return formatCategories(participant.categories || participant.category)?.replace(/,/g, ", ") || "Unassigned";
}

export function getNextBibNumber(users: Array<{ bib_number?: string | null }>): string {
  const highestAssignedBib = users.reduce((maxBib, user) => {
    const parsedBib = Number(user.bib_number);
    if (!Number.isFinite(parsedBib) || parsedBib < 1000) {
      return maxBib;
    }
    return Math.max(maxBib, parsedBib);
  }, 999);

  return String(highestAssignedBib + 1);
}

export function buildTicketPayload(participant: TicketParticipant): string {
  return [
    "RBA-BATTLE-RUN",
    participant.id,
    participant.bib_number ?? "",
    participant.email,
    participant.category,
  ].join("|");
}

export function parseTicketPayload(payload: string) {
  if (!payload.startsWith("RBA-BATTLE-RUN|")) {
    return null;
  }

  const [, id, bib_number, email, category] = payload.split("|");

  if (!id || !email || !category) {
    return null;
  }

  return {
    id,
    bib_number: bib_number || null,
    email,
    category,
  };
}

