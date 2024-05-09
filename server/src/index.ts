import express, {Response, Request} from "express";
import axios, { AxiosResponse } from "axios";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();

// Serve static files from the 'public' directory
app.use(express.static("public"));

const webAPIKey : string = process.env.WEB_API_KEY as string;
console.log("WEB API KEY", webAPIKey)
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
    capsule_imagev5: string
}

// Define a route for handling GET requests to the root URL
app.get("/", async (req : Request, res : Response) => {
    try {

        //SteamAPI
        const getUserLibrary : AxiosResponse = await axios.get<Game>(getOwnedAppsURL);          // Make a GET request to the Steam API /GetOwnedGames endpoint
        const userLibrary : Game [] = getUserLibrary.data.response.games;
        console.log(userLibrary)
        //const appCount = getUserLibrary.game_count;
        const appCount : number = 3;
        const appNames : string[] = [];
        const appIDs : number[] = [];
        const appImages : string[] = [];

        //CheapShark API
        const appDeals : string[] = [];

        //Collect Game Names
        //Collect Game appIDs
        //Collect cheapest deal
        for(let i = userLibrary.length - 1; i > userLibrary.length - 3; i--){
            appNames.push(userLibrary[i].name);
            appIDs.push(userLibrary[i].appid);
            //GET the lowest price from cheapshark API
            const gameDeal = await axios.get (`https://www.cheapshark.com/api/1.0/games?steamAppID=${userLibrary[i].appid}`);
            appDeals.push(gameDeal.data[0].cheapest);
        }

        //Collect app image
        for (let i = 0; i < appIDs.length; i++) {
            const appIDResponse = await axios.get(getAppDetailsURL+appIDs[i]);
            try{
                appImages.push(appIDResponse.data[appIDs[i]].data.capsule_imagev5);
            }
            catch(error)
            {
                appImages.push("null");
            }

        }

        // Render the 'index.ejs' template
        res.render(
            "index.ejs", 
            { 
                game_count: appCount,
                game_names: appNames,
                game_images: appImages,
                game_deals: appDeals
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
});

app.listen(port, () => {
console.log(`Server running on port: ${port}`);
});