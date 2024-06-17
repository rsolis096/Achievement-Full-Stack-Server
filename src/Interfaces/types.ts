export interface OwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    has_community_visible_stats: boolean;
}

export interface Game {
    appid: number;
    playtime: number;
    user_achievements: Achievement[];
}


export interface Achievement {
    icon: string;
    name: string;
    icongray: string;
    description: string;
    displayName: string;
}

export interface SteamUser {
    id: string;
    displayName: string;
    photos: string[];
}