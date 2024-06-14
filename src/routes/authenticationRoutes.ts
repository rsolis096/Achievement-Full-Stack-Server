// src/routes/achievementRoutes.ts
import { Router } from 'express';
import {authReturn, postAuthLogout, checkAuth} from "../controllers/authenticationController.js";
import passport from "passport";

const router = Router();

//login does not need an implementation
router.get('/steam/login', passport.authenticate('steam'));

router.get('/steam/return', authReturn);
router.get('/steam/logout', postAuthLogout);
router.get('/steam/checkAuthenticated', checkAuth);


export default router;