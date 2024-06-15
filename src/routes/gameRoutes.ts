// src/routes/gameRoutes.ts
import { Router } from 'express';
import {getGamesSearch, postUserLibrary} from '../controllers/gameController.js';

const router = Router();

router.post('/getUserLibrary', postUserLibrary);
router.post('/getGames/search', getGamesSearch);


export default router;