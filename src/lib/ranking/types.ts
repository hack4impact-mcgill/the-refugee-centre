import type {
  Attendance,
  DayOfWeek,
  Language,
  RankingTier,
  ShiftOfferStatus,
} from "@/generated/prisma/enums";

export type AvailabilityWindow = {
  day: DayOfWeek;
  startMinute: number;
  endMinute: number;
};

export type RankingVolunteer = {
  id: string;
  languages: Language[];
  positionIds: string[];
  availability: AvailabilityWindow[];
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

export type RankedCandidate = {
  volunteerId: string;
  rank: number;
  tier: RankingTier;
  penalty: number;
  flaggedForReview: boolean;
  shiftsAttended: number;
  lastAttendedAt: Date | null;
  reason: string;
};
