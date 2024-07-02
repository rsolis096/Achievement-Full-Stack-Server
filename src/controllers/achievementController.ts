// src/controllers/achievementController.ts
import { Request, Response } from 'express';
import axios, {AxiosError, AxiosResponse} from 'axios';
import db from '../db/dbConfig.js';

import {GameAchievement, UserAchievement, SteamUser, extractSteamUser, Game} from "../Interfaces/types.js";
import { time } from 'console';

const webAPIKey = process.env.WEB_API_KEY as string; //small one
const demoSteamId= process.env.DEMO_STEAM_ID as string

//Corresponds to GameAchievement Type
const getGameAchievementsURL = `https://api.steampowered.com/IPlayerService/GetGameAchievements/v1/?key=${webAPIKey}&language=english&appid=`;

interface Result {
    userAchievements: UserAchievement[];
    time: number;
    last_sync: string;
}



/*##################
  MAIN ENDPOINTS
##################*/

/* Retrieve User Achievement Data
Retrieves the users unlock statistics for a game given the appid passed in the request body
It returns an array of UserAchievement items.
*/
export const postUserAchievements = async (req: Request, res: Response) => {

    if(!req.body.appid){
        return res.json({error: "Please include an appid in the request body"})
    }

    try {
        let steamUser : SteamUser = {} as SteamUser
        let syncRequested : boolean = false;
        if(req.body.demo){
            req.user = { id: demoSteamId }; //This enables authentication automatically
            steamUser.id = demoSteamId;
        }else{
            steamUser = extractSteamUser(req.user);
        }

        if(req.body.sync){
            console.log("Sync Request made")
            syncRequested = true;
        }

        // The app being checked
        const appid = req.body.appid;

        //Current time
        const timeToReturn = new Date().toLocaleString('en-US', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });;

        //Attempt to get the library from the database
        const responseFromDB: Result = await fetchUserAchievementsFromDB(appid, steamUser.id)

        //If the response is not null
        if(responseFromDB.userAchievements) {

            const userAchievements = responseFromDB.userAchievements
            const timeSinceSync = responseFromDB.time;
            const lastSync = responseFromDB.last_sync

            //If sync is requested, verify an adequate amount of time has passed
            if(syncRequested && timeSinceSync > 20){
                //If above return null or a sync request is made, attempt to get the user achievements from Steam
                const responseFromAPI: UserAchievement[] = await fetchUserAchievementsFromSteamAPI(appid, steamUser.id)
                
                if(responseFromAPI.length > 0) {
                    console.log("User Achievements sent via Steam API for appid: ", appid)
                    return res.json({userAchievements : responseFromAPI, time: 0, last_sync : timeToReturn} as Result);
                }
            }
            //If a sync is not requested, return database result as normal
            else {
                console.log("User Achievements sent via database for appid: ", appid)
                return res.json({userAchievements : userAchievements, time : 0, last_sync : lastSync} as Result);
            }

        }

        //If above return null, attempt to get the user achievements from Steam
        const responseFromAPI: UserAchievement[] = await fetchUserAchievementsFromSteamAPI(appid, steamUser.id)
        
        if(responseFromAPI.length > 0) {
            console.log("User Achievements sent via Steam API for appid: ", appid)

            return res.json({userAchievements : responseFromAPI, time: 0, last_sync : timeToReturn} as Result);
        }
        

    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in postUserAchievements: ", err)
        return res.json({error: "An error occurred while processing the request: ", err})
    }
};

/* Retrieve Game Achievement Data
Retrieves the Game Achievements associated with a game by appid sent in request body
This data is not user specific.
*/
export const postGameAchievements = async (req: Request, res: Response) => {
    try {

        //First attempt to get the global achievement data from the database
        const responseFromDB: GameAchievement[] = await fetchGameAchievementsFromDB(req.body.appid)
        if(responseFromDB) {
            if (responseFromDB.length > 0) {
                console.log("Game Achievements sent via database for appid: ", req.body.appid)
                return res.send(responseFromDB);
            }
        }

        const responseFromAPI: GameAchievement[] = await fetchGameAchievementsFromSteamAPI(req.body.appid)
        if(responseFromAPI.length > 0) {
            console.log("Global Achievements sent via Steam API for appid: ", req.body.appid)
            return res.send(responseFromAPI);
        }
        return res.json({error: "game has no achievements"})
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in postGlobalAchievements: ", err)
        return res.json({error: "An error occurred while processing the request: ", err})
    }
};


/*##################
  HELPER FUNCTIONS
##################*/

/*
Fetches the Game achievements from the database given an appid
Returns object of type GameAchievement[]
*/
const fetchGameAchievementsFromDB = async (appid : string) => {

    try{
        //Attempt to retrieve from database
        const queryText: string = 'SELECT game_achievements FROM games WHERE appid = $1'
        const result = await db.query(queryText, [appid]);
        const achievementsFromDB: GameAchievement[] = result.rows[0].game_achievements;
        return achievementsFromDB;
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchGlobalAchievementsFromDB: ", err)
        return []
    }
}

/*
Fetches the Game achievements from the steam API given an appid
Returns object of type GameAchievement[]
*/
const fetchGameAchievementsFromSteamAPI = async (appid : string) => {

    try {
        //Get global achievement data from the steam API
        const response: AxiosResponse = await axios.get(getGameAchievementsURL.concat(appid.toString()));
        const gameAchievementsFromAPI: GameAchievement[] = response.data.response.achievements;

        //Update the database with the retrieved info
        if (gameAchievementsFromAPI.length > 0) {
            const queryText = 'UPDATE games SET game_achievements = $1 WHERE appid = $2';
            try {
                await db.query(queryText, [JSON.stringify(gameAchievementsFromAPI), appid]);
            } catch (error) {
                console.error('Error executing query to write to database:', error);
            }
            return gameAchievementsFromAPI;
        }
        return [] as GameAchievement[]

    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchGameAchievementsFromSteamAPI: ", err)
        return []
    }
}

/*
Fetches the User achievements from the database given an appid and steam id
Returns object of type UserAchievement[]
*/
const fetchUserAchievementsFromDB = async (appid : string, steam_id : string) => {

    try{
        // Attempt to get from database
        const queryText: string = 'SELECT ua.user_achievements, last_sync FROM user_games ua WHERE ua.steam_id = $1 AND ua.appid = $2'
        const result = await db.query(queryText, [steam_id, appid]);

        //Time comparison
        const current_time = new Date().getTime();
        const last_sync  = new Date(result.rows[0].last_sync).getTime();
        const timeDifference : number = (current_time - last_sync) / (60 * 1000); 
        const timeToReturn : string = new Date(result.rows[0].last_sync) .toLocaleString('en-US', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          });
        const achievementsFromDB: UserAchievement[] = result.rows[0].user_achievements;
        return { userAchievements: achievementsFromDB, time : timeDifference, last_sync : timeToReturn} as Result
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchUserAchievementsFromDB: ", err)
        return { userAchievements: [] as UserAchievement[], time : 0 } as Result
    }
}

/*
Fetches the User achievements from the database given an appid and steam id
Returns object of type UserAchievement[]
*/
const fetchUserAchievementsFromSteamAPI = async (appid : string, steamId :string) => {

    try{
        //Reach out to SteamAPI
        const getUserAchievementsURL = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${webAPIKey}&steamid=${steamId}&appid=`;
        const response: AxiosResponse = await axios.get(getUserAchievementsURL.concat(appid.toString()));
        const achievementsFromAPI: UserAchievement[] = response.data.playerstats.achievements;
        //Update the Database with the retrieved info and latest sync time
        if (achievementsFromAPI.length > 0) {
            const queryText = 'UPDATE user_games SET user_achievements = $1, last_sync = NOW() WHERE appid = $2;';
            try {
                await db.query(queryText, [JSON.stringify(achievementsFromAPI), appid]);
            }catch(error){
                console.error('Error executing query to write to database:', error);
            }
        }
        return achievementsFromAPI
    }
    catch(error){
        //const err = error as AxiosError
        console.log("Error in fetchUserAchievementsFromDB: ")
        return [] as UserAchievement[]
    }
}
