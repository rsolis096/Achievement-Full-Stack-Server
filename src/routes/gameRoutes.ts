// src/routes/gameRoutes.ts
import { Router } from 'express';
import {postUserGamesSearch, postUserGames, getTopWeeklyGames, getMostPlayedGames, getAppInfo, getAllAppsV2, getTracklist, updateTrackedItem} from '../controllers/gameController.js';

const router = Router();


router.post('/getUserGames', postUserGames);
router.post('/getUserGames/search', postUserGamesSearch);
router.get('/getMostPlayedGames', getMostPlayedGames);
router.get('/getTopWeekly', getTopWeeklyGames);
router.post('/getAppInfo', getAppInfo);
router.post('/getTracklist', getTracklist)
router.post('/updateTrackedItem', updateTrackedItem)

//Works well, should only be ran weekly
//router.get('/getAppList/', getAllAppsV2)



export default router;