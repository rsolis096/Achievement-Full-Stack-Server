import { Request, Response } from 'express';

import db from '../db/dbConfig.js';

import { extractSteamUser } from '../Interfaces/types.js';

const CLIENT_DOMAIN = process.env.CLIENT_DOMAIN as string;

export const findUserBySteamId = async (steamId : string) => {
    console.log("Checking user in database!")
    const result = await db.query('SELECT EXISTS (SELECT 1 FROM users WHERE steam_id = $1)', [steamId]);
    return result.rows[0].exists;
};

export const createUser = async (steamId : string, displayName: string, photos : string[]) => {
    console.log("Writing user to database!")
    const result = await db.query(
        'INSERT INTO users (steam_id, displayname, photos) VALUES ($1, $2, $3) RETURNING *',
        [steamId, displayName, photos]
    );
    return result.rows[0];
};

export const authReturn = (req: Request, res: Response) => {
    if (req.user) {
        //Login the user to establish session
        req.logIn(req.user, (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (req.isAuthenticated()) {
                console.log("Returned From Steam: User is authenticated");
                return res.redirect(CLIENT_DOMAIN); // Client URL
            } else {
                console.log("Returned From Steam: User is not authenticated");
                return res.redirect(CLIENT_DOMAIN); // Redirect to login page
            }
        });
    } else {
        console.log("User is not authenticated");
        return res.redirect(CLIENT_DOMAIN); // Redirect to login page
    }
}

export const checkAuth = (req: Request, res: Response) => {
    //console.log("Check Authenticated - ", req.session);
    //console.log("Check Authenticated1 - ", req.user);
    if (req.isAuthenticated()) {
        console.log("Page Load: User is authenticated");
        return res.json({ authenticated: true, user: req.user });
    } else {
        console.log("Page Load: User is not authenticated");
        return res.json({ authenticated: false });
    }
}

//get for testing, should be post since client requests it (authenticationRouter)
export const logout = async (req: Request, res: Response) => {
    req.logOut((err: any) => {
        if (err) {
            return res.status(500).send({ message: 'Logout failed: ' + err });
        }
    });
    req.session = null as any;
    return res.json({ authenticated: req.isAuthenticated() });
}

//get for testing, should be post since client requests it (authenticationRouter)
export const deleteAccount = async (req: Request, res: Response) => {

    //Delete the user data
    if(req.user){
        const steamId = extractSteamUser(req.user).id;
        const queryUsers : string = "DELETE FROM users WHERE steam_id = $1"
        const queryUserGames : string = "DELETE FROM user_games WHERE steam_id = $1"
        try {
            const resultUserGames = await db.query(queryUserGames, [steamId]);
            const resultUsers = await db.query(queryUsers, [steamId]);
            console.log(`Deleted ${resultUsers.rowCount} rows from users`);
            console.log(`Deleted ${resultUserGames.rowCount} rows from user_games`);

          } catch (error) {
            console.error('Error deleting user rows:', error);
            return res.json({ authenticated: req.isAuthenticated(), success: false, message: "An error occurred during the deletion process" });
          }    
        }

    //Logout the user
    req.logOut((err: any) => {
        if (err) {
            return res.status(500).send({ message: 'Logout failed: ' + err });
        }
    });
    req.session = null as any;
    req.user = null as any;
    return res.json({ authenticated: req.isAuthenticated(), success: true, message: "successfully deleted user info" });
    }


