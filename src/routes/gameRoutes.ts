// src/routes/gameRoutes.ts
import { Router } from 'express';
import {postUserGamesSearch, postUserGames, getTopWeeklyGames, getMostPlayedGames} from '../controllers/gameController.js';

const router = Router();


router.post('/getUserGames', postUserGames);
router.post('/getUserGames/search', postUserGamesSearch);
router.get('/getMostPlayedGames', getMostPlayedGames);
router.get('/getTopWeekly', getTopWeeklyGames);



export default router;