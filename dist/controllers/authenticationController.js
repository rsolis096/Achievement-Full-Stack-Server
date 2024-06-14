import db from '../db/dbConfig.js';
export const findUserBySteamId = async (steamId) => {
    console.log("Checking user in database!");
    const result = await db.query('SELECT EXISTS (SELECT 1 FROM users WHERE steam_id = $1)', [steamId]);
    return result.rows[0].exists;
};
export const createUser = async (steamId, displayName, photos) => {
    console.log("Writing user to database!");
    const result = await db.query('INSERT INTO users (steam_id, display_name, photos) VALUES ($1, $2, $3) RETURNING *', [steamId, displayName, photos]);
    return result.rows[0];
};
export const getUserData = (req, res) => {
    if (!req.isAuthenticated()) {
        return res.json({ authenticated: false });
    }
    //console.log("Sending user data: ", req.user)
    return res.json(req.user);
};
export const getAuthReturn = (req, res) => {
    if (req.isAuthenticated()) {
        console.log("user is authenticated");
    }
    else {
        console.log("user is not authenticated");
    }
    return res.redirect("http://localhost:5173");
};
export const checkAuth = (req, res) => {
    if (req.isAuthenticated()) {
        console.log("you are authenticated");
        res.json({ authenticated: true });
    }
    else {
        res.json({ authenticated: false });
    }
};
//get for testing, should be post since client requests it (authenticationRouter)
export const postAuthLogout = (req, res) => {
    req.logout(function (err) {
        if (err) {
            console.log(err);
            return res.status(500).send("Error logging out");
        }
        // Check if the user is logged out
        if (req.isAuthenticated()) {
            return res.send("(server) ERROR: still logged in");
        }
        return res.redirect("http://localhost:5173");
    });
};
//# sourceMappingURL=authenticationController.js.map