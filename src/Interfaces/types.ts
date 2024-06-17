export interface OwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    has_community_visible_stats: boolean;
}

export interface GlobalAchievement{
    name : string;
    percent: number;
}

export interface GameAchievement {
    name: string;
    displayName: string;
    hidden: number
    description: string;
    icon: string;
    icongray: string;
}

export interface UserAchievement {
    apiname: string;
    achieved: number;
    unlocktime: number;
}

export interface SteamUser {
    id: string;
    displayName: string;
    photos: string[];
}

//Extract steam user data from req.user
export const extractSteamUser = (user: any): SteamUser => {
    const { id, displayName, photos } = user;
    return { id, displayName, photos };
};

