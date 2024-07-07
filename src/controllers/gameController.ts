// src/controllers/gameController.ts
import { Request, Response } from 'express';
import axios, {AxiosError, AxiosResponse} from 'axios';
import db from '../db/dbConfig.js';
import {OwnedGame, SteamUser, extractSteamUser, App, WeeklyGame} from "../Interfaces/types.js";

//Important Steam API values
const demoSteamId= process.env.DEMO_STEAM_ID as string
const webAPIKey = process.env.WEB_API_KEY as string; // small one
const accessToken = process.env.ACCESS_TOKEN as string; // long, 24 hour one

//Returns a list of appids of current top games
const getTopWeeklySellersURL : string =`https://api.steampowered.com/IStoreTopSellersService/GetWeeklyTopSellers/v1/?access_token=${accessToken}
&country_code=ca&input_json=%7B%22context%22%3A%7B%22language%22%3A%22english%22%2C%22country_code%22%3A%22ca%22%7D%7D`
const getMostPlayedURL : string = `https://api.steampowered.com/ISteamChartsService/GetMostPlayedGames/v1/?key=${webAPIKey}`
const getAppInfoURL : string = `https://store.steampowered.com/api/appdetails?appids=`
/*##################
  MAIN ENDPOINTS
##################*/


export const getAppInfo = async (req: Request, res: Response): Promise<Response> => {
    const appid: string = req.body.appid;
  
    try {
      // Check if the data is in the database
      const query: string = 'SELECT info FROM games WHERE appid = $1';
      const responseFromDB = await db.query(query, [appid]);
      const dataFromDB: App | undefined = responseFromDB.rows[0]?.info;
  
      // If it is, send it to the user
      if (dataFromDB) {
        console.log("Game info sent from DB")
        return res.send(dataFromDB);
      }
  
      // Retrieves app info from Steam API
      const responseAPI: AxiosResponse = await axios.get(`${getAppInfoURL}${appid}`);
      const responseData = responseAPI.data[appid].data;
      
      const data: App = {
        name: responseData.name,
        type: responseData.type,
        appid: parseInt(appid, 10),
        detailed_app: {
          legal_notice: responseData.legal_notice,
          publishers: responseData.publishers,
          developers: responseData.developers,
          release_date: responseData.release_date.date,
          price_overview: responseData.price_overview ? {
            currency: responseData.price_overview.currency,
            final_formatted: responseData.price_overview.final_formatted,
            initial_formatted: responseData.price_overview.initial_formatted,
          } : undefined,
          achievements: responseData.achievements ? {
            total: responseData.achievements.total,
          } : undefined,
        }
      };
  
      // Write this data to the database
      try {
        const queryText: string = 'UPDATE games SET info = $1 WHERE appid = $2';
        await db.query(queryText, [JSON.stringify(data), appid]);
      } catch (dbError) {
        console.error('Error updating database:', dbError);
      }

      console.log("Game info sent from API")
      // Send it to the user
      return res.send(data);
    } catch (error) {
      console.error('Error fetching app info:', error);
      return res.status(500).send({ error: 'Failed to fetch app info' });
    }
  };

export const getMostPlayedGames = async (req: Request, res: Response) => {
    try{
        //console.log("Get All Apps")
        //getAllApps()
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
        if(req.body.demo){
            req.user = { id: demoSteamId }; //This enables authentication automatically
            console.log("Demo mode used")
        }
        if(req.isAuthenticated()) {
            console.log("Request to get user games made!")
            const steamUser: SteamUser = extractSteamUser(req.user);

            // Verify that the user exists by checking if they own any games in the database
            const checkUserExists = await db.query("SELECT 1 FROM user_games WHERE steam_id= $1 limit 1", [steamUser.id]);

            //If nothing is returned, the user has no library and it should be retrieved from the api
            const checkUserExistsResult : boolean = checkUserExists.rows.length == 0 ? false : true;
            if(!checkUserExistsResult){
                //Fetch the user library from the steam API
                const getOwnedAppsURL = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?access_token=${accessToken}&steamid=${steamUser.id}&include_appinfo=true`;

                const responseAPI: AxiosResponse = await axios.get(getOwnedAppsURL);
                const gamesFromAPI: OwnedGame[] = responseAPI.data.response.games;
                if(gamesFromAPI.length){
                    res.send(gamesFromAPI)
                }else{
                    res.send([] as OwnedGame[])
                }
                //Send the response to the client then write to database 
                //Update the global database to specify if a game has achievements or not
                await addHasVisibleStats(gamesFromAPI);

                // Response contains an array of these items corresponding to games in the users library:
                // "appid": 220,
                // "name": "Half-Life 2",
                // "has_community_visible_stats": true,
                // "playtime_forever": 1146,
                await addUserLibrary(steamUser.id, gamesFromAPI);

                //Return this response to the user, their library
                //Includes
                /*
                     "appid": 220,
                     "name": "Half-Life 2",
                     "has_community_visible_stats": true,
                     "playtime_forever": 1146,
                 */
                return 
            }
            else{
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

        }
        else{
            console.log("User is not logged in!")
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
        if(req.body.demo){
            req.user = { id: demoSteamId }; //This enables authentication automatically using a demo account (mine)
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
const addHasVisibleStats = async (games: OwnedGame[]) => {
    const batchSize: number = 20
    for (let i = 0; i < games.length; i += batchSize) {
        const batch = games.slice(i, i + batchSize);
        const updates = batch
            .filter(game => game.appid !== undefined && game.has_community_visible_stats !== undefined)
            .map(game => `(${game.appid}, ${game.has_community_visible_stats})`)
            .join(',');

        if (updates.length === 0) continue; // Skip empty batches

        const queryText = `
            UPDATE games
            SET has_community_visible_stats = updates.has_community_visible_stats
            FROM (VALUES ${updates}) AS updates(appid, has_community_visible_stats)
            WHERE games.appid = updates.appid
        `;

        try {
            await db.query(queryText);
        } catch (error) {
            console.error('Error executing batch update:', error);
        }
    }
};

//Write the users Owned Games to the Owned Games Table (batch processing necessary for render hosting)
const addUserLibrary = async (userId: string, games: OwnedGame[]) => {
    const batchSize: number = 20
    for (let i = 0; i < games.length; i += batchSize) {
        const batch = games.slice(i, i + batchSize);
        const values = batch.map(game => `('${userId}', ${game.appid}, ${game.playtime_forever})`).join(',');

        const queryText = `
            INSERT INTO user_games (steam_id, appid, playtime_forever)
            VALUES ${values}
            ON CONFLICT (steam_id, appid) DO NOTHING
        `;

        try {
            await db.query(queryText);
        } catch (error) {
            console.error('Error executing batch insert:', error);
        }
    }
};


/*##################
  SCHEDULED FUNCTIONS
##################*/

//V1 returns a list of games in a page format, although it does appear to miss some games, v2 preferred
//It only returns appid and name
const getAllAppsV1 = async () =>{
    const getAllAppsURL :string = `https://api.steampowered.com/IStoreService/GetAppList/v1/?key=${webAPIKey}`
    try{

        //Initialize Game Data array
        let data : App[] = [];

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

//V2 Returns a list of all games
//It only returns appid and name
export const getAllAppsV2 = async (req : Request, res : Response) => {
    console.log("inside get all apps V2");
  
    try {
      // Get Games from Steam API
      const response: AxiosResponse = await axios.get(`https://api.steampowered.com/ISteamApps/GetAppList/v2/?key=${webAPIKey}`);
      const data: App[] = response.data.applist.apps;
  
      // Filter out apps without names
      const filteredData = data.filter(game => game.name.length > 0);
  
      // Write games to database in batches
      const batchSize = 500;
      for (let i = 0; i < filteredData.length; i += batchSize) {
        const batch = filteredData.slice(i, i + batchSize);
        const values = batch.map(game => `(${game.appid}, '${game.name.replace(/'/g, "''")}')`).join(',');
  
        const queryText = `
          INSERT INTO games (appid, name)
          VALUES ${values}
          ON CONFLICT (appid) DO NOTHING;
        `;
  
        try {
          await db.query(queryText);
          console.log(`Successfully wrote batch ${Math.ceil((i + batchSize) / batchSize)}`);
        } catch (error) {
          console.error('Error executing batch update:', error);
        }
      }
      return res.json({success: "Written all Apps to database"})
    } catch (error) {
      const err = error as AxiosError;
      console.log("Error in getAllAppsV2: ", err);
      return res.json({error: "Failed to write to database", message: err})
    }
  };