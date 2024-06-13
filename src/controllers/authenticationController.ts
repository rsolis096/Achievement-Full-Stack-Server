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


export const getAuth = (req: Request, res: Response) => {
    console.log("getAuth")
    res.redirect('/');
}

export const getAuthReturn = (req: Request, res: Response) => {
    console.log("getAuthReturn")
    if(req.isAuthenticated()) {
        console.log("user is authenticated")
    }else{
        console.log("user is not authenticated")
    }
    res.redirect("http://localhost:5173/")
}

export const checkAuth = (req: Request, res: Response) => {
    if(!req.isAuthenticated()) {
        return res.redirect('http://localhost:3000/auth/steam/login')
    }
    return res.json({ authenticated: req.isAuthenticated() });
}

//get for testing, should be post since client requests it (authenticationRouter)
export const postAuthLogout = (req: Request, res: Response) => {
    req.logout(function(err) {
        if (err) {
            console.log(err);
            return res.status(500).send("Error logging out");
        }
        // Check if the user is logged out
        if (!req.isAuthenticated()) {
            return res.send("logged out");
        } else {
            return res.send("still logged in");
        }
    });
}

