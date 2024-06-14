// src/routes/gameRoutes.ts
import { Router } from 'express';
import { getOwnedGames, getGamesSearch } from '../controllers/gameController.js';
const router = Router();
router.post('/getGames', getOwnedGames);
router.post('/getGames/search', getGamesSearch);
export default router;
//# sourceMappingURL=gameRoutes.js.map