export interface Achievement {
  icon: string;
  name: string;
  icongray: string;
  description: string;
  displayName: string;
}

export interface TotalAchievement {
  apiname: string;
  achieved: number;
  unlocktime: number;

  globaldata?: GlobalAchievement
  achievementinfo? : Achievement
}

export interface GlobalAchievement {
  name: string;
  percent: number;
}

export interface Game {
  appid: number;
  name: string;
  playtime_forever: number;
  img_icon_url: string;
  has_community_visible_stats: boolean;
  achievements: Achievement[];
}
