// src/controllers/achievementController.ts
import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import db from '../db/dbConfig.js';
import { handleError } from '../utils/errorHandler.js';

const webAPIKey = process.env.WEB_API_KEY as string; //Refreshes every 24 hours
const steamID = process.env.STEAM_ID as string;
const accessToken = process.env.ACCESS_TOKEN as string;
const getUserAchievementsURL = `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?key=${webAPIKey}&steamid=${steamID}&appid=`;
const getGlobalAchievementsURL = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?access_token=${accessToken}&gameid=`;

interface UserAchievement {
    apiname: string;
    achieved: number;
    unlocktime: string;
}

interface GlobalAchievement{
    name: string,
    percent : number
}

//Retrieve User Achievement Data
export const getUserAchievements = async (req: Request, res: Response) => {
    try {
        //Attempt to get user achievement data from the database first
        const result = await db.query(`SELECT user_achievements FROM games WHERE appid=${req.body.appid}`);
        const achievementsFromDB: UserAchievement[] = result.rows[0]?.user_achievements || [];

        if (achievementsFromDB.length > 0) {
            console.log('User Achievement data retrieved from database for appid', req.body.appid);
            return res.send(achievementsFromDB);
        }

        //If nothing was returned then get the user achievement data from the steam API
        console.log('User Achievement database empty, calling Steam API.');
        const response: AxiosResponse = await axios.get(getUserAchievementsURL.concat(req.body.appid.toString()));
        const achievementsFromAPI: UserAchievement[] = response.data.playerstats.achievements;

        //Update the database with the retrieved info
        if (achievementsFromAPI.length > 0) {
            const queryText = 'UPDATE games SET user_achievements = $1 WHERE appid = $2';
            await db.query(queryText, [JSON.stringify(achievementsFromAPI), req.body.appid]);
        }
        console.log('User Achievement data retrieved from Steam API for appid', req.body.appid);
        return res.send(achievementsFromAPI);
    } catch (error) {
        handleError(res, error as Error, 'An error occurred while processing the request.');
    }
};

//Retrive Global Achievement Data
export const getGlobalAchievements = async (req: Request, res: Response) => {
    try {
        //Attempt to get global achievement data from the database first
        const result = await db.query(`SELECT global_achievements FROM games WHERE appid=${req.body.appid}`);
        const globalAchievementsFromDB: GlobalAchievement[] = result.rows[0]?.global_achievements || [];

        if (globalAchievementsFromDB.length > 0) {
            console.log('Global Achievement data retrieved from database for appid', req.body.appid);
            return res.send(globalAchievementsFromDB);
        }

        //If nothing was returned then get the global achievement data from the steam API
        console.log('Global Achievement Database empty, calling Steam API.');
        const response: AxiosResponse = await axios.get(getGlobalAchievementsURL.concat(req.body.appid.toString()));
        const globalAchievementsFromAPI: GlobalAchievement[] = response.data.achievementpercentages.achievements;

        //Update the database with the retrieved info
        if (globalAchievementsFromAPI.length > 0) {
            const queryText = 'UPDATE games SET global_achievements = $1 WHERE appid = $2';
            await db.query(queryText, [JSON.stringify(globalAchievementsFromAPI), req.body.appid]);
        }
        console.log('Global Achievement data retrieved from Steam API for appid', req.body.appid);
        return res.send(globalAchievementsFromAPI);
    } catch (error) {
        handleError(res, error as Error, 'An error occurred while processing the request.');
    }
};