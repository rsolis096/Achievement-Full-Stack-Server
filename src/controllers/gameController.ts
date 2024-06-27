// src/controllers/gameController.ts
import { Request, Response } from 'express';
import axios, {AxiosError, AxiosResponse} from 'axios';
import db from '../db/dbConfig.js';
import {OwnedGame, SteamUser, extractSteamUser, TopGame} from "../Interfaces/types.js";
const demoSteamId: string = "76561198065706942"
const accessToken = process.env.ACCESS_TOKEN as string;

//Returns a list of appids of current top games
const getMostPlayedGames :string = `https://steamspy.com/api.php?request=top100in2weeks`

/*##################
  MAIN ENDPOINTS
##################*/

export const getTopGames = async (req : Request, res: Response) =>{

    try{

        //First attempt to get the library from the database
        const queryText: string = 'SELECT * FROM top_games'
        const result  = await db.query(queryText);
        const responseFromDB : TopGame[] = result.rows;

        if(responseFromDB){
            if(responseFromDB.length > 0){
                console.log("Top games retrieved from database.")
                return res.send(responseFromDB);
            }
        }

        //Get global achievement data from the steam API
        const responseFromAPI: AxiosResponse = await axios.get(getMostPlayedGames);
        const data : TopGame[] = Object.values(responseFromAPI.data);
        console.log("Top games retrieved from SteamSpy API.")

        //Write to the DB
        if (data.length > 0) {
            const queryText = 'insert into top_games (appid, name, developer, positive, negative) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (appid) do nothing';
            try {
                for (const game of data) {
                    await db.query(queryText, [game.appid, game.name, game.developer, game.positive, game.negative]);
                }            
            }catch(error){
                console.error('Error executing query to write to database:', error);
            }
        }

        return res.send(data)

    }
    
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchGlobalAchievementsFromSteamAPI: ", err)
        return []
    }

};

//Called immediately when the webpage is loaded
export const postUserGames = async (req: Request, res: Response) => {
    try {
        //Authenticate this request if its in demo mode
        if(req.query.demo){
            req.user = { id: demoSteamId }; //This enables authentication automatically
            console.log("Demo mode used")
        }
        if(req.isAuthenticated()) {
            const steamUser: SteamUser = extractSteamUser(req.user);

            // Verify that the user exists
            const checkUserExists = await db.query("SELECT 1 FROM user_games WHERE steam_id= $1", [steamUser.id]);
            const checkUserExistsResult : number = checkUserExists.rows[0]['?column?'];
            // The user does not have a library stored
            if(checkUserExistsResult != 1) {
                //Fetch the user library from the steam API
                const getOwnedAppsURL = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?access_token=${accessToken}&steamid=${steamUser.id}&include_appinfo=true`;
                const responseAPI: AxiosResponse = await axios.get(getOwnedAppsURL);
                const gamesFromAPI: OwnedGame[] = responseAPI.data.response.games;

                // Response contains an array of these items:
                // Write these to the Global Database
                // "appid": 220,
                // "name": "Half-Life 2",
                // "has_community_visible_stats": true,
                await addGlobalGames(gamesFromAPI);

                // Keep this for the user and fill their library:
                // "playtime_forever": 1146,
                await addUserLibrary(steamUser.id, gamesFromAPI);

                //Return this response to the user
                //Includes
                /*
                     "appid": 220,
                     "name": "Half-Life 2",
                     "has_community_visible_stats": true,
                     "playtime_forever": 1146,
                 */

                return res.send(gamesFromAPI)
            }else{
                // The User has a library stored (syncing must be supported later)

                // Retrieve it from the database
                const query : string = `
                    Select 
                        games.appid, 
                        games.name, 
                        games.has_community_visible_stats,
                        user_games.playtime_forever   
                        FROM games
                        JOIN user_games ON games.appid = user_games.appid
                        WHERE user_games.steam_id = $1
                        AND games.has_community_visible_stats IS NOT NULL
                        LIMIT $2`

                try {
                    const result = await db.query(query, [steamUser.id, req.body.count]);
                    const gamesFromDB: OwnedGame[] = result.rows;
                    //Return this response to the user
                    //Includes
                    /*
                         "appid": 220,
                         "name": "Half-Life 2",
                         "has_community_visible_stats": true,
                         "playtime_forever": 1146,
                     */
                    return res.send(gamesFromDB);
                }catch(error){
                    const err =error as AxiosError;
                    console.log(err)
                }
            }

        }else{
            return res.json( {error : "User Is Not Logged In"} );
        }
    } catch (error) {
        const err = error as AxiosError
        return res.status(500).json({response: err})
    }
};

//Used to parse database for matching search results
export const postUserGamesSearch = async (req: Request, res: Response) => {
    try {
        if(req.query.demo){
            req.user = { id: demoSteamId }; //This enables authentication automatically
        }
        const steamUser: SteamUser = extractSteamUser(req.user);
        const query: string = `
            WITH matched_games AS 
            (
                SELECT
                    appid,
                    name,
                    has_community_visible_stats
                FROM
                    games
                WHERE
                    name 
                ILIKE 
                    '%' || $1 || '%'
                )
            SELECT
                mg.appid,
                mg.name,
                mg.has_community_visible_stats,
                ug.playtime_forever
            From
                matched_games mg
            JOIN
                user_games ug ON mg.appid = ug.appid
            WHERE
                ug.steam_id = $2
            AND 
                mg.has_community_visible_stats IS NOT NULL`

        //Attempt to get User Game Library from database
        const result = await db.query(query, [req.body.lookup, steamUser.id]);

        // Response contains an array of these items:
        // Write these to the Global Database
        // "appid": 220,
        // "name": "Half-Life 2",
        // "has_community_visible_stats": true,
        // "playtime_forever": 1146,
        return res.status(200).send(result.rows)
    } catch (error) {
        const err = error as AxiosError
        return res.status(500).json({response: err})
    }
};

/*##################
  HELPER FUNCTIONS
##################*/

//Adds the users Owned Games to the global Games Table
const addGlobalGames = async (games: OwnedGame[]) => {
    for (const game of games) {
        const queryText = 'INSERT INTO games(name, appid, has_community_visible_stats) VALUES($1, $2, $3) ON CONFLICT (appid) DO NOTHING';
        await db.query(queryText, [game.name, game.appid ,  game.has_community_visible_stats]);
    }
};

//Write the users Owned Games to the Owned Games Table
const addUserLibrary = async (userId : string, games : OwnedGame[]) => {
    for (const game of games) {
        await db.query(
            'INSERT INTO user_games (steam_id, appid, playtime_forever) VALUES ($1, $2, $3) ON CONFLICT (steam_id, appid) DO NOTHING',
            [userId, game.appid, game.playtime_forever]
        );
    }
}