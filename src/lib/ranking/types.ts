import type {
  Attendance,
  DayOfWeek,
  DayPeriod,
  Language,
  RankingTier,
  ShiftOfferStatus,
} from "@/generated/prisma/enums";

export type AvailabilitySlot = { day: DayOfWeek; period: DayPeriod };

export type RankingVolunteer = {
  id: string;
  languages: Language[];
  positionIds: string[];
  availability: AvailabilitySlot[];
};

export type RankingOffer = {
  volunteerId: string;
  shiftId: string;
  status: ShiftOfferStatus;
  attendance: Attendance;
  sentAt: Date;
  respondedAt: Date | null;
  shift: { startTime: Date };
};

export type RankingShift = {
  id: string;
  startTime: Date;
  endTime: Date;
  positionId: string | null;
  requiredLanguages: Language[];
};

export type ScoreComponents = {
  overdue: number;
  weekLoad: number;
};

export type RankedCandidate = {
  volunteerId: string;
  rank: number;
  tier: RankingTier;
  penalty: number;
  flaggedForReview: boolean;
  score: number;
  components: ScoreComponents;
  lastShiftAt: Date | null;
  reason: string;
};
