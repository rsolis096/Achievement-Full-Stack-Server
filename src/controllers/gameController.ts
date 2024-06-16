// src/controllers/gameController.ts
import { Request, Response } from 'express';
import axios, {AxiosError, AxiosResponse} from 'axios';
import db from '../db/dbConfig.js';
import { handleError } from '../utils/errorHandler.js';

// webAPIKey = process.env.WEB_API_KEY as string;
const accessToken = process.env.ACCESS_TOKEN as string;

//const getOwnedAppsURL = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?access_token=${accessToken}&steamid=${steamID}&include_appinfo=true`;
//const getGameAchievements : string = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${webAPIKey}&appid=`

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    has_community_visible_stats: boolean;
    achievements: Achievement[];
}

interface Achievement {
    icon: string;
    name: string;
    icongray: string;
    description: string;
    displayName: string;
}

interface SteamUser {
    id: string;
    displayName: string;
    photos: string[];
}

//Extract steam user data from req.user
const extractSteamUser = (user: any): SteamUser => {
    const { id, displayName, photos } = user;
    return { id, displayName, photos };
};

//Adds the user's library to the global database, returns user library as Game items
export const postUserLibrary = async (req: Request, res: Response) => {
    try {
        if(req.isAuthenticated()) {

            const steamUser: SteamUser = extractSteamUser(req.user);
            const getOwnedAppsURL = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?access_token=${accessToken}&steamid=${steamUser.id}&include_appinfo=true`;

            //Retrieve User Game Library from Steam API
            const response: AxiosResponse = await axios.get(getOwnedAppsURL);
            const gamesFromAPI: Game[] = response.data.response.games;

            //Write Users Game Library to the Global Games database (just library, no specific user info)
            if (gamesFromAPI.length > 0) {
                await addGlobalGames(gamesFromAPI);
            }

            //Insert the user's game library into the user_games table.
            if (gamesFromAPI.length > 0) {
                await addUserLibrary(steamUser.id, gamesFromAPI);
            }

            //At this point, the users library contributed to global games table
            //And we now have access to the users specific library (references global game table)

            return res.send(gamesFromAPI);
        }else{
            return res.json( {error : "User Is Not Logged In"} );
        }
    } catch (error) {
        handleError(res, error as Error, 'An error occurred while processing the request.');
    }
};

//Used to parse database for matching search results
export const getGamesSearch = async (req: Request, res: Response) => {
    try {
        console.log("Search Request Made")
        const lookupTerm : string = req.body.lookup;
        const steamUser: SteamUser = extractSteamUser(req.user);
        const query: string = `
            WITH matched_games AS 
            (
                SELECT
                    app_id,
                    name,
                    has_community_visible_stats,
                    global_achievements
                FROM
                    games
                WHERE
                    name 
                ILIKE 
                    '%' || $1 || '%'
            )
            SELECT
                mg.app_id,
                mg.name AS name,
                ug.playtime,
                ug.user_achievements
            FROM
                matched_games mg
            JOIN
                user_games ug ON mg.app_id = ug.app_id
            WHERE
                ug.steam_id = $2`

        //Attempt to get User Game Library from database
        const result = await db.query(query, [lookupTerm, steamUser.id]);
        console.log(result.rows)
        //YOU MUST SEND A RESPONSE
        return res.status(200).send(result.rows)
    } catch (error) {
        const err = error as AxiosError
        console.log(err);
    }
};

/*##################
  HELPER FUNCTIONS
##################*/

//Used to write a set of games to the global games table
const addGlobalGames = async (games: Game[]) => {
    for (const game of games) {
        const queryText = 'INSERT INTO games(name, app_id, has_community_visible_stats, global_achievements) VALUES($1, $2, $3, $4) ON CONFLICT (app_id) DO NOTHING';
        await db.query(queryText, [game.name, game.appid ,  game.has_community_visible_stats, JSON.stringify(game.achievements)]);
    }
};

//Used to write a set of user owned games to a table associated with the user
const addUserLibrary = async (userId : string, games : Game[]) => {
    for (const game of games) {
        await db.query(
            'INSERT INTO user_games (steam_id, app_id, playtime, user_achievements) VALUES ($1, $2, $3, $4) ON CONFLICT (steam_id, app_id) DO NOTHING',
            [userId, game.appid, game.playtime_forever, JSON.stringify(game.achievements)]
        );
    }
}