// src/controllers/achievementController.ts
import { Request, Response } from 'express';
import axios, {AxiosError, AxiosResponse} from 'axios';
import db from '../db/dbConfig.js';

import {GameAchievement, GlobalAchievement, UserAchievement, SteamUser, extractSteamUser} from "../Interfaces/types.js";

const webAPIKey = process.env.WEB_API_KEY as string;
const accessToken = process.env.ACCESS_TOKEN as string;//Refreshes every 24 hours
const demoSteamId: string = "76561198065706942"

//Corresponds to GlobalAchievement Type
const getGlobalAchievementsURL = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?access_token=${accessToken}&gameid=`;

//Corresponds to GameAchievement Type
const getGameAchievementsURL:string = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${webAPIKey}&appid=`



/*##################
  MAIN ENDPOINTS
##################*/



//Retrieve User Achievement Data
export const postUserAchievements = async (req: Request, res: Response) => {
    try {
        let steamUser : SteamUser = {} as SteamUser
        if(req.query.demo){
            req.user = { id: demoSteamId }; //This enables authentication automatically
            steamUser.id = demoSteamId;
        }else{
            steamUser = extractSteamUser(req.user);
        }

        //First attempt to get the library from the database
        const responseFromDB: UserAchievement[] = await fetchUserAchievementsFromDB(req.body.appid, steamUser.id)

        if(responseFromDB) { //Can be null if not in database yet, would need to write it if it is
            if (responseFromDB.length > 0) {
                console.log("User Achievements sent via database for appid: ", req.body.appid)
                return res.send(responseFromDB);
            }
        }

        //If above fails, attempt to get the user library from Steam
        const achievementsFromAPI: UserAchievement[] = await fetchUserAchievementsFromSteamAPI(req.body.appid, steamUser.id)
        if(achievementsFromAPI.length > 0) {
            console.log("User Achievements sent via Steam API for appid: ", req.body.appid)
            return res.send(achievementsFromAPI);
        }
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in postUserAchievements: ", err)
        return res.json({error: "An error occurred while processing the request: ", err})
    }
};

// Retrieve Global Achievement Data
export const postGlobalAchievements = async (req: Request, res: Response) => {
    try {
        let steamUser : SteamUser = {} as SteamUser
        if(req.query.demo){
            req.user = { id: demoSteamId }; //This enables authentication automatically
            steamUser.id = demoSteamId;
        }else{
            steamUser = extractSteamUser(req.user);
        }
        //First attempt to get the global achievement data from the database
        const responseFromDB: GlobalAchievement[] = await fetchGlobalAchievementsFromDB(req.body.appid)
        if(responseFromDB) {
            if (responseFromDB.length > 0) {
                console.log("Global Achievements sent via database for appid: ", req.body.appid)
                return res.send(responseFromDB);
            }
        }

        //If above fails, attempt to get the user library from Steam
        const responseFromAPI: GlobalAchievement[] = await fetchGlobalAchievementsFromSteamAPI(req.body.appid)
        if(responseFromAPI.length > 0) {
            console.log("Global Achievements sent via Steam API for appid: ", req.body.appid)
            return res.send(responseFromAPI);
        }
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in postGlobalAchievements: ", err)
        return res.json({error: "An error occurred while processing the request: ", err})
    }
};

// Retrieve General Achievement Data (icons and stuff)
export const postGameAchievements = async (req: Request, res: Response) => {
    try {
        let steamUser : SteamUser = {} as SteamUser
        if(req.query.demo){
            req.user = { id: demoSteamId }; //This enables authentication automatically
            steamUser.id = demoSteamId;
        }else{
            steamUser = extractSteamUser(req.user);
        }
        //First attempt to get the global achievement data from the database
        const responseFromDB: GameAchievement[] = await fetchGameAchievementsFromDB(req.body.appid)

        if(responseFromDB){
            if(responseFromDB.length > 0 ) {
                console.log("Game Achievements sent via database for appid: ", req.body.appid)
                return res.send(responseFromDB);
            }
        }

        //If above fails, attempt to get the user library from Steam
        const responseFromAPI: GameAchievement[] = await fetchGameAchievementsFromSteamAPI(req.body.appid)
        if(responseFromAPI.length > 0) {
            console.log("Game Achievements sent via Steam API for appid: ", req.body.appid)
            return res.send(responseFromAPI);
        }
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

//First we look in the database to get the user achievements
const fetchGlobalAchievementsFromDB = async (appid : string) => {

    try{
        //Attempt to retrieve from database
        const queryText: string = 'SELECT global_achievements FROM games WHERE appid = $1'
        const result = await db.query(queryText, [appid]);
        const achievementsFromDB: GlobalAchievement[] = result.rows[0].global_achievements;
        return achievementsFromDB;
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchGlobalAchievementsFromDB: ", err)
        return []
    }
}

//Used as a backup if the user achievements aren't in the database
const fetchGlobalAchievementsFromSteamAPI = async (appid : string) => {

    try {
        //Get global achievement data from the steam API
        const response: AxiosResponse = await axios.get(getGlobalAchievementsURL.concat(appid.toString()));
        const globalAchievementsFromAPI: GlobalAchievement[] = response.data.achievementpercentages.achievements;

        //Update the database with the retrieved info
        if (globalAchievementsFromAPI.length > 0) {
            const queryText = 'UPDATE games SET global_achievements = $1 WHERE appid = $2';
            try {
                await db.query(queryText, [JSON.stringify(globalAchievementsFromAPI), appid]);
            } catch (error) {
                console.error('Error executing query to write to database:', error);
            }
        }
        return globalAchievementsFromAPI;
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchGlobalAchievementsFromSteamAPI: ", err)
        return []
    }
}

//First we look in the database to get the user achievements
const fetchUserAchievementsFromDB = async (appid : string, steam_id : string) => {

    try{
        // Attempt to get from database
        const queryText: string = 'SELECT ua.user_achievements FROM user_games ua WHERE ua.steam_id = $1 AND ua.appid = $2'
        const result = await db.query(queryText, [steam_id, appid]);
        const achievementsFromDB: UserAchievement[] = result.rows[0].user_achievements;
        return achievementsFromDB;
    }
    catch(error){
        //const err = error as AxiosError
        console.log("Error in fetchUserAchievementsFromDB: ")
        return []
    }
}

//Used as a backup if the user achievements aren't in the database
const fetchUserAchievementsFromSteamAPI = async (appid : string, steamId :string) => {

    try{
        //Reach out to SteamAPI
        const getUserAchievementsURL = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${webAPIKey}&steamid=${steamId}&appid=`;
        const response: AxiosResponse = await axios.get(getUserAchievementsURL.concat(appid.toString()));
        const achievementsFromAPI: UserAchievement[] = response.data.playerstats.achievements;
        //Update the Database with the retrieved info
        if (achievementsFromAPI.length > 0) {
            const queryText = 'UPDATE user_games SET user_achievements = $1 WHERE appid = $2';
            try {
                await db.query(queryText, [JSON.stringify(achievementsFromAPI), appid]);
            }catch(error){
                console.error('Error executing query to write to database:', error);
            }
        }
        return achievementsFromAPI;
    }
    catch(error){
        //const err = error as AxiosError
        console.log("Error in fetchUserAchievementsFromDB: ")
        return []
    }
}

//First we look in the database to get the user achievements
const fetchGameAchievementsFromDB = async (appid : string) => {

    try{
        // Attempt to get from database
        const queryText: string = 'SELECT game_achievements FROM games WHERE appid = $1'
        const result = await db.query(queryText, [appid]);
        const achievementsFromDB: GameAchievement[] = result.rows[0].game_achievements;
        return achievementsFromDB;
    }
    catch(error){
        //const err = error as AxiosError
        console.log("Error in fetchGameAchievementsFromDB: ")
        return []
    }
}

//Used as a backup if the user achievements aren't in the database
const fetchGameAchievementsFromSteamAPI = async (appid : string) => {

    try{
        //Reach out to SteamAPI
        const response: AxiosResponse = await axios.get(getGameAchievementsURL.concat(appid.toString()));
        const result: GameAchievement[] = response.data.game.availableGameStats.achievements;

        //Update the Database with the retrieved info
        if (result.length > 0) {
            const queryText = 'UPDATE games SET game_achievements = $1 WHERE appid = $2';
            try {
                await db.query(queryText, [JSON.stringify(result), appid]);
            }catch(error){
                console.error('Error executing query to write to database:', error);
            }
        }
        return result;
    }
    catch(error){
        //const err = error as AxiosError
        console.log("Error in fetchGameAchievementsFromDB: ")
        return []
    }
}



