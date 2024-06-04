// src/routes/gameRoutes.ts
import { Router } from 'express';
import { getOwnedGames } from '../controllers/gameController.js';

const router = Router();

router.post('/getGames', getOwnedGames);

export default router;