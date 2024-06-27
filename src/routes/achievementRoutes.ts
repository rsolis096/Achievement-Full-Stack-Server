// src/routes/achievementRoutes.ts
import { Router } from 'express';
import {
    postUserAchievements,
    postGlobalAchievements,
    postGameAchievements,
} from '../controllers/achievementController.js';

const router = Router();

router.post('/getUserAchievements', postUserAchievements);
router.post('/getGlobalAchievements', postGlobalAchievements)
router.post('/getGameAchievements', postGameAchievements)



export default router;