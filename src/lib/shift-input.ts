import "server-only";

import { Language, ShiftLocation } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

/** Parses an ISO date string, or returns null if it isn't one. */
export function parseDate(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isLanguageList(value: unknown): value is Language[] {
  const languages: unknown[] = Object.values(Language);
  return Array.isArray(value) && value.every((v) => languages.includes(v));
}

function isLocation(value: unknown): value is ShiftLocation {
  return (Object.values(ShiftLocation) as unknown[]).includes(value);
}

type ParseResult =
  | { data: Prisma.ShiftCreateInput; error?: never }
  | { data?: never; error: string };

/**
 * Validates a request body against `ShiftInput` (see lib/shifts.ts) and maps
 * it onto the database columns.
 */
export function parseShiftInput(body: unknown): ParseResult {
  if (typeof body !== "object" || body === null) {
    return { error: "Body must be a JSON object" };
  }
  const input = body as Record<string, unknown>;

  if (typeof input.title !== "string" || !input.title.trim()) {
    return { error: "title is required" };
  }
  const startTime = parseDate(input.start);
  const endTime = parseDate(input.end);
  if (!startTime || !endTime) {
    return { error: "start and end must be ISO dates" };
  }
  if (endTime < startTime) {
    return { error: "end must not be before start" };
  }
  if (typeof input.allDay !== "boolean") {
    return { error: "allDay must be a boolean" };
  }
  if (!isLocation(input.location)) {
    return { error: "location is invalid" };
  }
  if (input.address !== undefined && typeof input.address !== "string") {
    return { error: "address must be a string" };
  }
  if (
    !isLanguageList(input.requiredLanguages) ||
    !isLanguageList(input.preferredLanguages)
  ) {
    return { error: "languages are invalid" };
  }

  return {
    data: {
      title: input.title.trim(),
      startTime,
      endTime,
      allDay: input.allDay,
      location: input.location,
      address: input.address?.trim() || null,
      requiredLanguages: input.requiredLanguages,
      preferredLanguages: input.preferredLanguages,
    },
  };
}
