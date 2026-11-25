export type RankingConfig = {
  timeZone: string;
  weeklyCap: number;
  maxNoShows: number;
  attendanceWindowDays: number;
  tiebreakSeed: string;
};

export const RANKING_CONFIG: RankingConfig = {
  timeZone: "America/Toronto",
  weeklyCap: 2,
  maxNoShows: 2,
  attendanceWindowDays: 90,
  tiebreakSeed: "rc-52",
};
