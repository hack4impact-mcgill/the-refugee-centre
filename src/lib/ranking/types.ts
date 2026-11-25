import type {
  AssignmentStatus,
  Attendance,
  DayOfWeek,
  Language,
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

export type RankingAssignment = {
  volunteerId: string;
  shiftId: string;
  status: AssignmentStatus;
  attendance: Attendance;
  shift: { startTime: Date; endTime: Date };
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
  shiftsAttended: number;
  lastAttendedAt: Date | null;
};
