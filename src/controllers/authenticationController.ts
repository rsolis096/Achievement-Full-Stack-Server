import { Request, Response } from 'express';

import db from '../db/dbConfig.js';

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


export const getAuthReturn = (req: Request, res: Response) => {
    if(req.isAuthenticated()) {
        console.log("user is authenticated")
        const redirectUrl = new URL('https://achievement-full-stack-client.onrender.com');
        redirectUrl.searchParams.append('user', JSON.stringify(req.user)); // Add user data to URL
        return res.redirect(redirectUrl.toString());
    }else{
        console.log("user is not authenticated")
    }
    return res.redirect( "https://achievement-full-stack-client.onrender.com"); //client
}

export const checkAuth = (req: Request, res: Response) => {
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
        return res.redirect( "https://achievement-full-stack-client.onrender.com");//client
    });
}

