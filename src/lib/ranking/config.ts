export type RankingConfig = {
  timeZone: string;
  halfLifeDays: number;
  lookbackDays: number;
  tierBThreshold: number;
  tierCThreshold: number;
  weeklyCap: number;
  overdueAfterDays: number;
  overdueBonus: number;
  languageBonus: number;
  weekLoadWeight: number;
  targetPerWeek: number;
  eventWeights: {
    expired: number;
    rejected: number;
    cancelledByVolunteer: number;
    noShow: number;
    withdrawn: number;
    excused: number;
  };
  scarceLanguageMaxShare: number;
  newVolunteerOverdue: boolean;
  trackingStartDate: Date | null;
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
  languageBonus: 0.5,
  weekLoadWeight: 1.5,
  targetPerWeek: 1,
  eventWeights: {
    expired: 0.5,
    rejected: 1,
    cancelledByVolunteer: 1.5,
    noShow: 3,
    withdrawn: 0,
    excused: 0,
  },
  scarceLanguageMaxShare: 0.25,
  newVolunteerOverdue: true,
  trackingStartDate: null,
  afternoonStartHour: 12,
  eveningStartHour: 17,
  tiebreakSeed: "rc-52",
};
