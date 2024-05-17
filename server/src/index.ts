import express, {Response, Request} from "express";
import axios, { AxiosResponse } from "axios";
import env from "dotenv";
import cors from "cors";
import pg from "pg";

//http://media.steampowered.com/steamcommunity/public/images/apps/{appid}/{hash}.jpg

const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static("public"));

//Enable CORS
app.use(cors({
    origin: 'http://localhost:5173'
}));

env.config();

//Configure connection to database
const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "Games",
    password: process.env.POSTGRES_PASSWORD,
    port: 5432
});

db.connect();


const webAPIKey : string = process.env.WEB_API_KEY as string;
const accessToken : string = process.env.ACCESS_TOKEN as string
const steamID : string = process.env.STEAM_ID as string

// Define the URL of the Steam API endpoint (for getOwned Apps)
const getOwnedAppsURL : string = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?access_token=${accessToken}&steamid=${steamID}&include_appinfo=true`;
const getAppDetailsURL : string = "https://store.steampowered.com/api/appdetails?appids=";

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended : true }));

interface Achievement{
    icon: string,
    name: string,
    icongray: string,
    description: string,
    displayName: string,
}

interface Game{
    appid : number,
    name: string,
    playtime_forever: number,
    img_icon_url: string,
    has_community_visible_stats: boolean,
    achievements : Achievement []
}

// Error handling helper
const handleError = (res: Response, error: Error, message: string) => {
    console.error(message, error.message);
    res.status(500).send({ error: message, details: error.message });
};

// Function to retrieve game library from the database
const getGamesFromDB = async (): Promise<Game[]> => {
    const result = await db.query("SELECT * from Games");
    return result.rows;
}

//Function to get game achievement information for games in the users libraries
const getAchievementsFromSteamAPI = async (games: Game[]): Promise<Game[]> => {

    const achievementPromises = games.map(async (game) => {

        const response : AxiosResponse = await axios.get(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${webAPIKey}&appid=${game.appid}`);    
        
        //Verify JSON format
        if(response.data.game && response.data.game.availableGameStats && response.data.game.availableGameStats.achievements){
            game.achievements = response.data.game.availableGameStats.achievements;
        }
        else if(response.data.playerstats && response.data.playerstats.achievements){
            game.achievements = response.data.playerstats.achievements;
        }
    })

    // Wait for all achievement-fetching promises to complete
    await Promise.all(achievementPromises);

    return games;
} 

// Function to fetch games from Steam API
const getGamesFromSteamAPI = async (): Promise<Game[]> => {
    const response : AxiosResponse = await axios.get<Game>(getOwnedAppsURL);          // Make a GET request to the Steam API /GetOwnedGames endpoint  

    let userLibrary : Game [] = response.data.response.games;

    //Filter out games without achievements
    userLibrary = userLibrary.filter((game) =>
        game.has_community_visible_stats === true
    );

    return userLibrary.map(transformToGame);

}

// Function to transform the API response to conform to the Game interface (helper for getGamesFromSteamAPI())
const transformToGame = (apiGame: any): Game => {
    return {
        appid: apiGame.appid,
        name: apiGame.name,
        playtime_forever: apiGame.playtime_forever,
        img_icon_url: apiGame.img_icon_url,
        has_community_visible_stats: apiGame.has_community_visible_stats,
        achievements: []// Return uninitialized object of type Achievement
    };
};

// Function to save games to the database
const saveGamesToDB = async (games: Game[]): Promise<void> => {

    const queryText = 'INSERT INTO games (appid, name, playtime_forever, has_community_visible_stats, achievements) VALUES ($1, $2, $3, $4, $5)';
    const queryPromises = games.map(game => {
        return db.query(queryText, [
            game.appid,
            game.name,
            game.playtime_forever,
            game.has_community_visible_stats,
            JSON.stringify(game.achievements) // Ensure achievements are properly serialized as JSON
        ]);
    });
    
    await Promise.all(queryPromises);
};

// Define a route for handling GET requests to the root URL
app.get("/", async (req : Request, res : Response) => {

    try{     

        //Attempt to retrieve steam library from the database (achievements included)
        const gamesFromDB : Game[] = await getGamesFromDB();

        if (gamesFromDB.length > 0) {
            console.log('Game data retrieved from database.');
            return res.send(gamesFromDB);
        }

        //This executes if the database results are empty does not send a response
        console.log('Database empty, calling Steam API');
        var gamesFromAPI : Game[] = await getGamesFromSteamAPI();
        if(gamesFromAPI.length > 0){

            //If the API returned a Library, collect its achievements and update gamesFromAPI
            gamesFromAPI = await getAchievementsFromSteamAPI(gamesFromAPI);
            //If the API returned a Library then write it to the database
            await saveGamesToDB(gamesFromAPI)
        }
        console.log("APPLE");
        return res.status(200).send(gamesFromAPI);
    }
    catch(error){
        handleError(res, error as Error, 'An error occurred while processing the request.');
    }

});

app.listen(port, () => {
console.log(`Server running on port: ${port}`);
});




/*
    //GET the lowest price from cheapshark API
    const gameDeal = await axios.get (`https://www.cheapshark.com/api/1.0/games?steamAppID=${userLibrary[i].appid}`);
    appDeals.push(gameDeal.data[0].cheapest);
*/