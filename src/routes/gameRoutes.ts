// src/routes/gameRoutes.ts
import { Router } from 'express';
import {postUserGamesSearch, postUserGames, getTopGames} from '../controllers/gameController.js';

const router = Router();


router.post('/getUserGames', postUserGames);
router.post('/getUserGames/search', postUserGamesSearch);
router.get('/getTopGames', getTopGames)


export default router;