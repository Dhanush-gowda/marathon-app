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
  "5K Run",
  "3K Run",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
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
    "TURAHALLI-RUN",
    participant.id,
    participant.bib_number ?? "",
    participant.email,
    participant.category,
  ].join("|");
}

export function parseTicketPayload(payload: string) {
  if (!payload.startsWith("TURAHALLI-RUN|")) {
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

