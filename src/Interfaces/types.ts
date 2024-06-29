export interface OwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    has_community_visible_stats: boolean;
}

export interface GameAchievement {
    internal_name: string,
    localized_name: string,
    localized_desc: string,
    icon: string,
    icon_gray: string,
    hidden: boolean,
    player_percent_unlocked: string
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

export interface Game{
    appid: number;
    name: string;
    
}

export interface WeeklyGame{
    appid: number;
    rank: number;
    name : string;
}

