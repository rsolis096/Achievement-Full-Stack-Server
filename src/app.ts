// src/app.ts
import express from 'express';
import cors from 'cors';
import env from 'dotenv';
import gameRoutes from './routes/gameRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import authenticationRoutes from "./routes/authenticationRoutes.js";
import passport from "passport";
import session from 'express-session';
import cookieSession from 'cookie-session'
import SteamStrategy from "passport-steam";


import {findUserBySteamId, createUser} from "./controllers/authenticationController.js";

const webAPIKey = process.env.WEB_API_KEY as string;

env.config();

const app = express();

//Define Middleware
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Used to allow client to make requests to the server
app.use(cors({
    origin: 'https://completiontracker.com',
    credentials: true,
}));

app.use(cookieSession({
    name: 'session',
    secret: 'keyboard cat',
    maxAge: 30 * 24 * 60 * 60 // 30 days
}));

app.set('trust proxy', 1) // trust first proxy

// Initialize Passport and restore authentication state from the session
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(obj : any, done) {
    done(null, obj);
});

passport.use(new SteamStrategy({
        returnURL: 'https://api.completiontracker.com/auth/steam/return', //server
        realm: 'https://api.completiontracker.com/', //server
        apiKey: webAPIKey
    },
    async function(identifier, profile, done) {
        //Handle Errors
        //Return User Object (store into session, done by serialize and deserialize)
        //^ tested using req.isAuthenticated();
        //^ data accessed using req.user
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