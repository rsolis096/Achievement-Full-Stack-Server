// src/routes/achievementRoutes.ts
import { Router } from 'express';
import { getUserAchievements, getGlobalAchievements } from '../controllers/achievementController.js';

const router = Router();

router.post('/getAchievements', getUserAchievements);
router.post('/getGlobalAchievements', getGlobalAchievements)

export default router;