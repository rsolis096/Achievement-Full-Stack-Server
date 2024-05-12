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

interface Game{
    appid : number,
    name: string,
    capsule_imagev5: string,
    playtime_forever: number,
    img_icon_url: string
}

app.get("/api", (req : Request, res : Response) => {
    console.log("API endpoint hit");
    res.json({apple : "fruit"});
})

// Define a route for handling GET requests to the root URL
app.get("/", async (req : Request, res : Response) => {

    var inDatabase : boolean = false;

    //Attempt to retreive from the database
    try{
        const result = await db.query("SELECT * from Games");
        //result is the game data that is to be loaded (they are all of type 'Game' and indexes by [])
        inDatabase = true;
        console.log("Database hit successfully!")
        res.send(result.rows);
    }
    catch(e){
        if(e instanceof Error ){
            console.error("Failed to make request:", e.message);
        }
        res.send("<h1>Failed to make request:</h1>");
    }

    //If it is not in the database then attempt to retreive from the SteamAPI
    if(inDatabase == false){
        try {
            //Get Library from SteamAPI
            const getUserLibrary : AxiosResponse = await axios.get<Game>(getOwnedAppsURL);          // Make a GET request to the Steam API /GetOwnedGames endpoint
            var userLibrary : Game [] = getUserLibrary.data.response.games;
    
            //Collect app image from SteamAPI
            for (let i = userLibrary.length - 1; i > userLibrary.length - 3 ; i--) {
                //Get the image URL from steam
                const appIDResponse = await axios.get(getAppDetailsURL + userLibrary[i].appid);
                const appid : number = userLibrary[i].appid;
                userLibrary[i].capsule_imagev5 = appIDResponse.data[appid].data.capsule_imagev5;
            }

            const tempLibrary : Game[]= [
                userLibrary[userLibrary.length - 1],
                userLibrary[userLibrary.length - 2],
                userLibrary[userLibrary.length - 3],
            ]

            userLibrary = tempLibrary;
            console.log(userLibrary);

            //Write The data retrieved from the API to the database
            try {
                await Promise.all(userLibrary.map(game => {
                    db.query("INSERT INTO games (appid, name, playtime_forever, img_icon_url, capsule_imagev5) VALUES ($1, $2, $3, $4, $5)", [game.appid, game.name, game.playtime_forever, game.img_icon_url, game.capsule_imagev5 ]);
                }))
            } catch (e) {
                if(e instanceof Error ){
                    // Log an error message if the request fails
                    console.error("Failed to make query to database:", e.message);
                }
            }    
            
            // Render the 'index.ejs' template
            res.render(
                "index.ejs", 
                { 
                    game_count: 3,
                    game_names: userLibrary.map( (game : Game) => game.name),
                    game_images: userLibrary.map( (game : Game) => game.capsule_imagev5),
                    game_deals: userLibrary.map( (game : Game) => game.appid)
                }
            );  
    
        } catch ( e) {
            if(e instanceof Error ){
            // Log an error message if the request fails
            console.error("Failed to make request:", e.message);
            }
            // Render the 'index.ejs' template
            res.send("<h1>Failure</h1>");
        }
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