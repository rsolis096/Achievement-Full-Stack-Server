// src/routes/achievementRoutes.ts
import { Router } from 'express';
import {getAuthReturn, postAuthLogout, checkAuth} from "../controllers/authenticationController.js";
import passport from "passport";

const router = Router();

//login does not need an implementation
router.get('/steam/login', passport.authenticate('steam'));

router.get('/steam/return',   passport.authenticate('steam', { failureRedirect: '/login' }), getAuthReturn);
router.get('/steam/logout', postAuthLogout);
router.get('/steam/checkAuthenticated', checkAuth);


export default router;