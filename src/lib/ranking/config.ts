export type RankingConfig = {
  timeZone: string;
  halfLifeDays: number;
  lookbackDays: number;
  tierBThreshold: number;
  tierCThreshold: number;
  weeklyCap: number;
  overdueAfterDays: number;
  overdueBonus: number;
  weekLoadWeight: number;
  eventWeights: {
    expired: number;
    rejected: number;
    cancelledByVolunteer: number;
    noShow: number;
    withdrawn: number;
    excused: number;
  };
  newVolunteerOverdue: boolean;
  afternoonStartHour: number;
  eveningStartHour: number;
  tiebreakSeed: string;
};

export const RANKING_CONFIG: RankingConfig = {
  timeZone: "America/Toronto",
  halfLifeDays: 28,
  lookbackDays: 180,
  tierBThreshold: 2.5,
  tierCThreshold: 6,
  weeklyCap: 2,
  overdueAfterDays: 14,
  overdueBonus: 2,
  weekLoadWeight: 1.5,
  eventWeights: {
    expired: 0.5,
    rejected: 1,
    cancelledByVolunteer: 1.5,
    noShow: 3,
    withdrawn: 0,
    excused: 0,
  },
  newVolunteerOverdue: true,
  afternoonStartHour: 12,
  eveningStartHour: 17,
  tiebreakSeed: "rc-52",
};
