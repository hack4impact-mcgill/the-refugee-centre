import type { RankingTier } from "@/generated/prisma/enums";
import type { RankingConfig } from "./config";
import { daysElapsed } from "./time";
import type { RankingOffer } from "./types";

function isNoShow(offer: RankingOffer) {
  return offer.status === "ACCEPTED" && offer.attendance === "NO_SHOW";
}

function eventWeight(offer: RankingOffer, config: RankingConfig) {
  const weights = config.eventWeights;
  switch (offer.status) {
    case "EXPIRED":
      return weights.expired;
    case "REJECTED":
      return weights.rejected;
    case "CANCELLED_BY_VOLUNTEER":
      return weights.cancelledByVolunteer;
    case "WITHDRAWN":
      return weights.withdrawn;
    case "ACCEPTED":
      if (offer.attendance === "NO_SHOW") return weights.noShow;
      if (offer.attendance === "EXCUSED") return weights.excused;
      return 0;
    case "PENDING":
      return 0;
  }
}

/** A no-show dates from the missed shift, because `respondedAt` is when they accepted. */
function eventTime(offer: RankingOffer) {
  if (isNoShow(offer)) return offer.shift.startTime;
  return offer.respondedAt ?? offer.sentAt;
}

export function calculatePenalty(
  offers: RankingOffer[],
  now: Date,
  config: RankingConfig,
) {
  return offers.reduce((sum, offer) => {
    const daysAgo = daysElapsed(eventTime(offer), now, config.timeZone);
    if (daysAgo > config.lookbackDays) return sum;
    const decay = 0.5 ** (daysAgo / config.halfLifeDays);
    return sum + eventWeight(offer, config) * decay;
  }, 0);
}

export function tierForPenalty(
  penalty: number,
  config: RankingConfig,
): RankingTier {
  if (penalty < config.tierBThreshold) return "A";
  if (penalty <= config.tierCThreshold) return "B";
  return "C";
}
