import type {
  Attendance,
  DayOfWeek,
  DayPeriod,
  Language,
  RankingTier,
  ShiftOfferStatus,
} from "@/generated/prisma/enums";

export type AvailabilitySlot = { day: DayOfWeek; period: DayPeriod };

export type RankingEnrollment = {
  semester: { startDate: Date; endDate: Date };
  enrolledAt: Date;
  targetPerWeek: number;
  pausedUntil: Date | null;
};

export type RankingVolunteer = {
  id: string;
  createdAt: Date;
  languages: Language[];
  positionIds: string[];
  availability: AvailabilitySlot[];
  enrollments: RankingEnrollment[];
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
  preferredLanguages: Language[];
};

export type ScoreComponents = {
  deficit: number;
  overdue: number;
  language: number;
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
