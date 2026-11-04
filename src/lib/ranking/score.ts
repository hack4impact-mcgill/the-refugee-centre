import type { Language } from "@/generated/prisma/enums";
import type { RankingConfig } from "./config";
import { acceptedInShiftWeek, enrollmentForShift } from "./filters";
import { calendarDaysBetween, isWithinDates, wholeWeeksBetween } from "./time";
import type {
  RankingOffer,
  RankingShift,
  RankingVolunteer,
  ScoreComponents,
} from "./types";

/** Includes upcoming shifts. */
function committedOffers(offers: RankingOffer[]) {
  return offers.filter(
    (offer) =>
      offer.status === "ACCEPTED" &&
      (offer.attendance === "ATTENDED" || offer.attendance === "UNMARKED"),
  );
}

export function lastShiftDate(offers: RankingOffer[]) {
  return committedOffers(offers).reduce<Date | null>(
    (latest, { shift }) =>
      !latest || shift.startTime > latest ? shift.startTime : latest,
    null,
  );
}

function later(a: Date, b: Date) {
  return a > b ? a : b;
}

function calculateDeficit(
  volunteer: RankingVolunteer,
  offers: RankingOffer[],
  shift: RankingShift,
  now: Date,
  config: RankingConfig,
) {
  const { timeZone, targetPerWeek, trackingStartDate } = config;
  const committed = committedOffers(offers);

  const enrollment = enrollmentForShift(volunteer, shift, config);
  if (enrollment) {
    const { semester } = enrollment;
    const weeks = wholeWeeksBetween(
      later(semester.startDate, enrollment.enrolledAt),
      now,
      timeZone,
    );
    const done = committed.filter((offer) =>
      isWithinDates(
        offer.shift.startTime,
        semester.startDate,
        semester.endDate,
        timeZone,
      ),
    ).length;
    return weeks * enrollment.targetPerWeek - done;
  }

  if (!trackingStartDate) return 0;
  const start = later(trackingStartDate, volunteer.createdAt);
  const done = committed.filter(
    (offer) => offer.shift.startTime >= start,
  ).length;
  return wholeWeeksBetween(start, now, timeZone) * targetPerWeek - done;
}

function calculateOverdue(
  lastShiftAt: Date | null,
  now: Date,
  config: RankingConfig,
) {
  if (!lastShiftAt) return config.newVolunteerOverdue ? config.overdueBonus : 0;
  const daysSince = calendarDaysBetween(lastShiftAt, now, config.timeZone);
  return daysSince >= config.overdueAfterDays ? config.overdueBonus : 0;
}

export function scarceLanguages(
  candidates: RankingVolunteer[],
  shift: RankingShift,
  config: RankingConfig,
) {
  const wanted = new Set([
    ...shift.requiredLanguages,
    ...shift.preferredLanguages,
  ]);
  return [...wanted].filter((language) => {
    const speakers = candidates.filter((candidate) =>
      candidate.languages.includes(language),
    ).length;
    return (
      speakers > 0 &&
      speakers / candidates.length <= config.scarceLanguageMaxShare
    );
  });
}

/** Pass only this volunteer's offers. */
export function calculateScore(
  volunteer: RankingVolunteer,
  offers: RankingOffer[],
  shift: RankingShift,
  scarce: Language[],
  now: Date,
  config: RankingConfig,
) {
  const lastShiftAt = lastShiftDate(offers);
  const scarceSpoken = scarce.filter((language) =>
    volunteer.languages.includes(language),
  );
  const components: ScoreComponents = {
    deficit: calculateDeficit(volunteer, offers, shift, now, config),
    overdue: calculateOverdue(lastShiftAt, now, config),
    language: scarceSpoken.length > 0 ? config.languageBonus : 0,
    weekLoad: acceptedInShiftWeek(offers, shift, config),
  };
  const score =
    components.deficit +
    components.overdue +
    components.language -
    config.weekLoadWeight * components.weekLoad;

  return { score, components, lastShiftAt, scarceSpoken };
}
