// src/app.ts
import env from 'dotenv';
env.config();

import express from 'express';
import cors from 'cors';
import gameRoutes from './routes/gameRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import authenticationRoutes from "./routes/authenticationRoutes.js";
import passport from "passport";
import session from 'cookie-session';
import SteamStrategy from "passport-steam";

import {findUserBySteamId, createUser} from "./controllers/authenticationController.js";


const app = express();

// Acquire Environment Variables
const WEB_API_KEY = process.env.WEB_API_KEY as string;
const CLIENT_DOMAIN = process.env.CLIENT_DOMAIN as string;
const SERVER_DOMAIN = process.env.SERVER_DOMAIN as string;

//Define Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Used to allow client to make requests to the server
app.use(cors({
    origin: CLIENT_DOMAIN,
    credentials: true,
}));

app.use(session({
    name: 'session',
    secret: process.env.SECRET as string,
    sameSite: 'lax', 
    secure: process.env.SSL == "false" ? false : true, // For development, set to false
    httpOnly: process.env.SSL == "false" ? true : false, //True in prod
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
}));

app.set('trust proxy', 1) // trust first proxy

// Initialize Passport and restore authentication state from the session
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    return done(null, user);
});

passport.deserializeUser(function(obj : any, done) {
    return done(null, obj);
});

passport.use(new SteamStrategy({
        returnURL: SERVER_DOMAIN + '/auth/steam/return', //server
        realm: SERVER_DOMAIN, //server
        apiKey: WEB_API_KEY
    },
    async function(identifier, profile, done) {
        try{
            console.log("Login requested")
            let exists = false;
            //Verify User Exists in database using steamID
            await findUserBySteamId(profile.id).then((e : boolean) => {
                exists = e;
                //Create new user if necessary
                if (!exists) {
                    console.log("Value does not exist in database, writing it now.")
                    const photosArray = profile.photos.map(photo => {
                        return photo.value
                    });
                    createUser(profile.id, profile.displayName, photosArray);
                }
            });

        }catch(error){
            return done(error, null)
        }
        return done(null, profile);
    }
));


//Define handlers for usable endpoints
app.use('/api/games', gameRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/auth', authenticationRoutes);


export default app;