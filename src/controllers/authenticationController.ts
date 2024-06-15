import { Request, Response } from 'express';

import db from '../db/dbConfig.js';

const CLIENT_DOMAIN = process.env.CLIENT_DOMAIN as string;

export const findUserBySteamId = async (steamId : string) => {
    console.log("Checking user in database!")
    const result = await db.query('SELECT EXISTS (SELECT 1 FROM users WHERE steam_id = $1)', [steamId]);
    return result.rows[0].exists;
};

export const createUser = async (steamId : string, displayName: string, photos : string[]) => {
    console.log("Writing user to database!")
    const result = await db.query(
        'INSERT INTO users (steam_id, display_name, photos) VALUES ($1, $2, $3) RETURNING *',
        [steamId, displayName, photos]
    );
    return result.rows[0];
};


export const authReturn = (req: Request, res: Response) => {
    console.log("Return From Steam - Session:", req.session);
    if (req.user) {
        req.login(req.user, (err) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (req.isAuthenticated()) {
                console.log("User is authenticated");
                return res.redirect(CLIENT_DOMAIN); // Client URL
            } else {
                console.log("User is not authenticated");
                return res.redirect(CLIENT_DOMAIN); // Redirect to login page
            }
        });
    }else {
        console.log("User is not authenticated");
        return res.redirect(CLIENT_DOMAIN); // Redirect to login page
    }
}

export const checkAuth = (req: Request, res: Response) => {
    console.log("Check Authenticated - Session:", req.session);
    if (req.isAuthenticated()) {
        console.log("you are authenticated")
        res.json({ authenticated: true, user:req.user });
    } else {
        console.log("you are not authenticated")
        res.json({ authenticated: false});
    }
}

//get for testing, should be post since client requests it (authenticationRouter)
export const postAuthLogout = (req: Request, res: Response) => {
    req.logout(function(err) {
        if (err) {
            console.log(err);
            return res.status(500).send("Error logging out");
        }
        // Check if the user is logged out
        if (req.isAuthenticated()) {
            return res.send("(server) ERROR: still logged in");
        }
        return res.redirect( CLIENT_DOMAIN);//client
    });
}

