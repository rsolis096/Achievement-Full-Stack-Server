// src/routes/gameRoutes.ts
import { Router } from 'express';
import {postUserGamesSearch, postUserGames, getTopWeeklyGames, getMostPlayedGames, getAppInfo, getAllAppsV2} from '../controllers/gameController.js';

const router = Router();


router.post('/getUserGames', postUserGames);
router.post('/getUserGames/search', postUserGamesSearch);
router.get('/getMostPlayedGames', getMostPlayedGames);
router.get('/getTopWeekly', getTopWeeklyGames);
router.post('/getAppInfo', getAppInfo);
router.get('/getAppList/testpath', getAllAppsV2)



export default router;