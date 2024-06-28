// src/controllers/gameController.ts
import { Request, Response } from 'express';
import axios, {AxiosError, AxiosResponse} from 'axios';
import db from '../db/dbConfig.js';
import {OwnedGame, SteamUser, extractSteamUser, Game, WeeklyGame} from "../Interfaces/types.js";

//Important Steam API values
const demoSteamId= process.env.DEMO_STEAM_ID as string
const webAPIKey = process.env.WEB_API_KEY as string; // small one
const accessToken = process.env.ACCESS_TOKEN as string; // long, 24 hour one

//Returns a list of appids of current top games
const getAllAppsURL :string = `https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${webAPIKey}`
const getTopWeeklySellersURL : string =`https://api.steampowered.com/IStoreTopSellersService/GetWeeklyTopSellers/v1/?access_token=${accessToken}
&country_code=ca&input_json=%7B%22context%22%3A%7B%22language%22%3A%22english%22%2C%22country_code%22%3A%22ca%22%7D%7D`
const getMostPlayedURL : string = `https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?key=${webAPIKey}`

/*##################
  MAIN ENDPOINTS
##################*/

export const getMostPlayedGames = async (req: Request, res: Response) => {
    try{

        //If above fails, get from steam api
        //Fetch the user library from the steam API
        const responseAPI: AxiosResponse = await axios.get(getMostPlayedURL);
        const data: WeeklyGame[] = responseAPI.data.response.ranks;


        //Get the name from the database and append it to the data elements, return that modified array
        const queryText: string = 'SELECT name FROM games WHERE appid = $1;';
        const weeklyGames: WeeklyGame[] = await Promise.all(
            data.map(async (item: { appid: number; rank: number }) => {
              const result = await db.query(queryText, [item.appid]);
              return {
                appid: item.appid,
                rank: item.rank,
                name: result.rows.length > 0 ? result.rows[0].name : "undefined",
              };
            })
          );
        //Send the data to the client
        return res.send(weeklyGames);
    }
    catch (error) {
        const err = error as AxiosError
        //console.log(err)
        return res.status(500).json({response: err})
    }
}

export const getTopWeeklyGames = async (req: Request, res: Response) => {
    try{

        //If above fails, get from steam api
        //Fetch the user library from the steam API
        const responseAPI: AxiosResponse = await axios.get(getTopWeeklySellersURL);
        const data: WeeklyGame[] = responseAPI.data.response.ranks;

        const bestGames: WeeklyGame[] = (
            data.map((item, index : number) => {
              return {
                appid: item.appid,
                rank: item.rank,
                name: responseAPI.data.response.ranks[index].item.name as string
              };
            })
        )
        //Send the data to the client
        return res.send(bestGames);

    }
    catch (error) {
        const err = error as AxiosError
        console.log(err)
        return res.status(500).json({response: err})
    }
}


//Called after the user signs in
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

//Used to parse database for matching search results, only used when logged in
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


/*##################
  SCHEDULED FUNCTIONS
##################*/

//This endpoint is used to build the database of all games and is not meant to be used regularly
//Each game is returned as the type Game but only with appid and name.
//This endpoint should be scheduled weekly to build a library of new games
const getAllApps = async () =>{

    try{

        //Initialize Game Data array
        let data : Game[] = [];

        //Other Important Data
        let have_more_results : boolean = true;
        let last_appid : number = 0;

        //Next request data
        let counter = 0;
        while ( have_more_results) {
            console.log("Iteration ", counter, "starting at ", last_appid)
            //Get global achievement data from the steam API
            const response: AxiosResponse = await axios.get(getAllAppsURL + `&last_appid=${last_appid}`);

            data.push(... response.data.response.apps)

            if (data.length > 0) {
                const queryText = 'insert into games (appid, name) VALUES ($1, $2) ON CONFLICT (appid) do nothing';
                try {
                    for (const game of data) {
                        if(game.appid && game.name.length > 0){
                            await db.query(queryText, [game.appid, game.name]);
                        }
                    }            
                }catch(error){
                    console.error('Error executing query to write to database:', error);
                }
            }

            console.log("Iteration ", counter, "starting at ", last_appid, " length of data: ", data.length)
            data = []

            //Check if theres more data to be retrieved
            if('have_more_results' in response.data.response && 'last_appid' in response.data.response){
                have_more_results = response.data.response.have_more_results;
                last_appid = response.data.response.last_appid;
            }else{
                have_more_results = false;
                last_appid = 0;
            }
            counter++;
        }

    // Write to the DB in bulk
    if (data.length > 0) {
        const queryText = 'INSERT INTO games (appid, name) VALUES ';
        const values: string[] = [];
        const params: (number | string)[] = [];
  
        data.forEach((game, index) => {
          if (game.appid && game.name.length > 0) {
            values.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
            params.push(game.appid, game.name);
          }
        });
  
        const finalQuery = queryText + values.join(', ') + ' ON CONFLICT (appid) DO NOTHING';
  
        try {
          await db.query(finalQuery, params);
        } catch (error) {
          console.error('Error executing query to write to database:', error);
        }
      }
      return true;
    }
    
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchGlobalAchievementsFromSteamAPI: ", err)
        return false
    }

};