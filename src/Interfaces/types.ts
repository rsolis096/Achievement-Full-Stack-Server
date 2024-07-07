export interface OwnedGame {
    appid: number;
    name: string;
    playtime_forever: number;
    has_community_visible_stats: boolean;
}

export interface App{
    type: string, //"game", "dlc", "hardware", etc
    name: string;
    appid: number;
    detailed_app?: {
        legal_notice : string;
        publishers : string[];
        developers : string[];
        release_date : string;
        price_overview? : { 
            currency : string;
            final_formatted : string;
            initial_formatted : string;
        }
        achievements? :{
            total : number;
        }

    }
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

