// src/routes/gameRoutes.ts
import { Router } from 'express';
import { getOwnedGames } from '../controllers/gameController.js';

const router = Router();

router.get('/getGames', getOwnedGames);

export default router;