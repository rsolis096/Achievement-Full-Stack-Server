// src/routes/gameRoutes.ts
import { Router } from 'express';
import {postUserGamesSearch, postUserGames, getTopWeeklyGames, getMostPlayedGames, getAppInfo} from '../controllers/gameController.js';

const router = Router();


router.post('/getUserGames', postUserGames);
router.post('/getUserGames/search', postUserGamesSearch);
router.get('/getMostPlayedGames', getMostPlayedGames);
router.get('/getTopWeekly', getTopWeeklyGames);
router.post('/getAppInfo', getAppInfo);



export default router;