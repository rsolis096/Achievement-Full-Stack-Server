// src/routes/achievementRoutes.ts
import { Router } from 'express';
import {
    postUserAchievements,
    postGlobalAchievements,
    postGeneralAchievements
} from '../controllers/achievementController.js';

const router = Router();

router.post('/getAchievements', postUserAchievements);
router.post('/getGlobalAchievements', postGlobalAchievements)
router.post('/getGeneralAchievements', postGeneralAchievements)


export default router;