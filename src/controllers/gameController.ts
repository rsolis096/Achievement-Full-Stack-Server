// src/controllers/gameController.ts
import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import db from '../db/dbConfig.js';
import { handleError } from '../utils/errorHandler.js';

//const webAPIKey = process.env.WEB_API_KEY as string;
const accessToken = process.env.ACCESS_TOKEN as string;
const steamID = process.env.STEAM_ID as string;

const getOwnedAppsURL = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?access_token=${accessToken}&steamid=${steamID}&include_appinfo=true`;

interface Game {
    appid: number;
    name: string;
    playtime_forever: number;
    img_icon_url: string;
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

export const getOwnedGames = async (req: Request, res: Response) => {
    try {
        //Attempt to get User Game Library from database
        const result = await db.query('SELECT * FROM games LIMIT $1', [req.body.count]);
        let gamesFromDB: Game[] = result.rows;

        if (gamesFromDB.length > 0) {
            console.log('Owned Game data retrieved from database');
            return res.status(200).send(gamesFromDB);
        }

        //If nothing returned, then retrieve User Game Library from Steam API
        console.log('Owned Games database empty, calling Steam API.');
        const response: AxiosResponse = await axios.get(getOwnedAppsURL);
        const gamesFromAPI: Game[] = response.data.response.games;

        //Write data from Steam API onto database
        if (gamesFromAPI.length > 0) {
            await saveGamesToDB(gamesFromAPI);
        }
        return res.status(200).send(gamesFromAPI);
    } catch (error) {
        handleError(res, error as Error, 'An error occurred while processing the request.');
    }
};

export const getGamesSearch = async (req: Request, res: Response) => {
    try {
        const lookupTerm : string = req.body.lookup;

        //Attempt to get User Game Library from database
        const result = await db.query('SELECT * FROM games WHERE name ILIKE $1 LIMIT $2', [`%${lookupTerm}%`, 10]);

        //YOU MUST SEND A RESPONSE
        return res.status(200).send(result.rows)
    } catch (error) {
        handleError(res, error as Error, 'An error occurred while processing the request.');
    }
};

const saveGamesToDB = async (games: Game[]) => {
    for (const game of games) {
        const queryText = 'INSERT INTO games(appid, name, playtime_forever, img_icon_url, has_community_visible_stats, achievements) VALUES($1, $2, $3, $4, $5, $6) ON CONFLICT (appid) DO NOTHING';
        await db.query(queryText, [game.appid, game.name, game.playtime_forever, game.img_icon_url, game.has_community_visible_stats, JSON.stringify(game.achievements)]);
    }
};