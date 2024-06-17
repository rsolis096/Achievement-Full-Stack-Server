// src/routes/gameRoutes.ts
import { Router } from 'express';
import {postUserGamesSearch, postUserGames} from '../controllers/gameController.js';

const router = Router();


router.post('/getUserGames', postUserGames);
router.post('/getUserGames/search', postUserGamesSearch);


export default router;