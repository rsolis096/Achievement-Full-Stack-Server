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
    playtime_forever: number,
    img_icon_url: string
    has_community_visible_stats: boolean
}

interface Achievement{
    name: string,
    displayName: string,
    description: string ,
    icon: string,
    icongray: string         
}

// Define a route for handling GET requests to the root URL
app.get("/", async (req : Request, res : Response) => {

    var inDatabase : boolean = false;

    //Attempt to retrieve steam library from the database
    try{     
        const result = await db.query("SELECT * from Games");
        if(result.rows.length == 0){
            console.log("Database empty, calling steam API")
        }
        else{
            inDatabase = true;
            console.log("Game data retrieved from database.")
            res.send(result.rows)
        }

    }catch(e){
        let m :string = "";
        if(e instanceof Error ){
            m = e.message;
            console.error("Failed to make database query:", e.message);
        }
        res.status(500).send(m);
        return;
    }

    //If it is not in the database then attempt to retrieve from the SteamAPI
    if(inDatabase == false){

        var userLibrary : Game [] = [];

        //Attempt to retrieve steam library from Steam API
        try {
            //Get Library from SteamAPI
            const response : AxiosResponse = await axios.get<Game>(getOwnedAppsURL);          // Make a GET request to the Steam API /GetOwnedGames endpoint  
            userLibrary = response.data.response.games;

            //Filter out games without achievements
            userLibrary = userLibrary.filter((game) =>
                  game.has_community_visible_stats === true
            );
            
        } catch(e){
            let m :string = "";
            if(e instanceof Error ){
                m = e.message;
                console.error("Failed to make request to Steam API:", e.message);
            }
            res.status(500).send(m);
            return;
        }

        //If the user has games, write it to the database
        if(userLibrary.length != 0){
            try {

                //Write the game list data retrieved from the API to the database
                await Promise.all(userLibrary.map(game => {
                    db.query("INSERT INTO games (appid, name, playtime_forever, has_community_visible_stats) VALUES ($1, $2, $3, $4)", [game.appid, game.name, game.playtime_forever, game.has_community_visible_stats]);
                }))

            } catch(e){
                let m :string = "";
                if(e instanceof Error ){
                    m = e.message;
                    console.error("Failed to write user library to database:", e.message);
                }
                res.status(500).send(m);
                return;
            }

            //For each game, get the achievment data and write to the database
            userLibrary.forEach(async (game) =>{
                try{
                    const response : AxiosResponse = await axios.get(`https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${webAPIKey}&appid=${game.appid}`);    
                    let gameAchievements : Achievement [] = []
                    
                    //Verify JSON format
                    if(response.data.game && response.data.game.availableGameStats && response.data.game.availableGameStats.achievements){
                        gameAchievements = response.data.game.availableGameStats.achievements;
                    }
                    else if(response.data.playerstats && response.data.playerstats.achievements){
                        gameAchievements = response.data.playerstats.achievements;
                    }
                    
                    //Write achievement JSON to database
                    await Promise.all(gameAchievements.map( (ach : Achievement) => {
                        if(ach != null){
                            db.query("Update games set achievements = $1 where appid = $2", [ach, game.appid]);
                        }
                    }))

                } catch(e){
                    let m :string = "";
                    if(e instanceof Error ){
                        m = e.message;
                        console.error("Failed to write user achievements to database:", e.message);
                    }
                    res.status(500).send(m);
                    return;
                }
            })
        }

        res.status(200).send(userLibrary);
        return;
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