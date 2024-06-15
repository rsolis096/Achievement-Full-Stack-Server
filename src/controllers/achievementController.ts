// src/controllers/achievementController.ts
import { Request, Response } from 'express';
import axios, {AxiosError, AxiosResponse} from 'axios';
import db from '../db/dbConfig.js';
import { handleError } from '../utils/errorHandler.js';

const webAPIKey = process.env.WEB_API_KEY as string;
const steamID = process.env.STEAM_ID as string;
const accessToken = process.env.ACCESS_TOKEN as string;//Refreshes every 24 hours

const getUserAchievementsURL = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${webAPIKey}&steamid=${steamID}&appid=`;
const getGlobalAchievementsURL = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?access_token=${accessToken}&gameid=`;
const getGeneralAchievementsURL:string = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${webAPIKey}&appid=`

interface UserAchievement {
    apiname: string;
    achieved: number;
    unlocktime: number;
}

interface GlobalAchievement{
    name: string,
    percent : number
}

interface GeneralAchievement{
    name: string,
    defaultvalue: number,
    displayName: string,
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

//Retrieve User Achievement Data
export const postUserAchievements = async (req: Request, res: Response) => {
    try {

        //First attempt to get the library from the database
        const steamUser: SteamUser = extractSteamUser(req.user);
        const achievementsFromDB: UserAchievement[] = await fetchUserAchievementsFromDB(req.body.appid, steamUser.id)
        if(achievementsFromDB.length > 0) {
            console.log("User Achievements sent via database for appid: ", req.body.appid)
            return res.send(achievementsFromDB);
        }

        //If above fails, attempt to get the user library from Steam
        const achievementsFromAPI: UserAchievement[] = await fetchUserAchievementsFromSteamAPI(req.body.appid)
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

        //First attempt to get the global achievement data from the database
        const responseFromDB: GlobalAchievement[] = await fetchGlobalAchievementsFromDB(req.body.appid)
        if(responseFromDB.length > 0) {
            console.log("Global Achievements sent via database for appid: ", req.body.appid)
            return res.send(responseFromDB);
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
export const postGeneralAchievements = async (req: Request, res: Response) => {
    try {
        //Get global achievement data from the steam API
        console.log('Fetching General Achievement data from API for a given game');
        const response: AxiosResponse = await axios.get(getGeneralAchievementsURL.concat(req.body.appid.toString()));
        const getGeneralAchievementsFromAPI: GeneralAchievement[] = response.data.game.availableGameStats.achievements;
        //Update the database with the retrieved info
        if (getGeneralAchievementsFromAPI.length > 0) {
            const queryText = 'UPDATE games SET game_achievements = $1 WHERE app_id = $2';
            try {
                const res = await db.query(queryText, [JSON.stringify(getGeneralAchievementsFromAPI), req.body.appid]);
                if (res.rowCount) {
                    console.log(`Successfully updated game_achievements for appid: ${req.body.appid}`);
                } else {
                    console.log(`No rows were updated for game_achievements with appid: ${req.body.appid}`);
                }
            }catch(error){
                console.error('Error executing query to write to database:', error);
            }
        }
        console.log('General Achievement data retrieved from Steam API for appid', req.body.appid);
        return res.send(getGeneralAchievementsFromAPI);
    } catch(error){
        console.log("Error in postGeneralAchievements: ")
        const err = error as AxiosError
        console.log(err.response?.data)
        return res.json({error: "Error occured"})
    }
};

/*##################
  HELPER FUNCTIONS
##################*/

//First we look in the database to get the user achievements
const fetchGlobalAchievementsFromDB = async (appid : string) => {

    try{
        //Attempt to retrieve from database
        const queryText: string = 'SELECT global_achievements FROM games WHERE app_id = $1'
        const result = await db.query(queryText, [appid]);
        const achievementsFromDB: GlobalAchievement[] = result.rows[0]?.user_achievements || [];
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
            const queryText = 'UPDATE games SET global_achievements = $1 WHERE app_id = $2';
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
        const queryText: string = 'SELECT ua.user_achievements FROM user_games ua WHERE ua.steam_id = $1 AND ua.app_id = $2'
        const result = await db.query(queryText, [steam_id, appid]);
        const achievementsFromDB: UserAchievement[] = result.rows[0].user_achievements || [];
        return achievementsFromDB;
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchUserAchievementsFromDB: ")
        return []
    }
}

//Used as a backup if the user achievements aren't in the database
const fetchUserAchievementsFromSteamAPI = async (appid : string) => {

    try{
        //Reach out to SteamAPI
        const response: AxiosResponse = await axios.get(getUserAchievementsURL.concat(appid.toString()));
        const achievementsFromAPI: UserAchievement[] = response.data.playerstats.achievements;
        //Update the Database with the retrieved info
        if (achievementsFromAPI.length > 0) {
            const queryText = 'UPDATE user_games SET user_achievements = $1 WHERE app_id = $2';
            try {
                await db.query(queryText, [JSON.stringify(achievementsFromAPI), appid]);
            }catch(error){
                console.error('Error executing query to write to database:', error);
            }
        }
        return achievementsFromAPI;
    }
    catch(error){
        const err = error as AxiosError
        console.log("Error in fetchUserAchievementsFromDB: ")
        return []
    }
}

