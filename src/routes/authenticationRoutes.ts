// src/routes/achievementRoutes.ts
import { Router } from 'express';
import {authReturn, logout, checkAuth, deleteAccount} from "../controllers/authenticationController.js";
import passport from "passport";

const router = Router();

//login does not need an implementation
router.get('/steam/login', passport.authenticate('steam', { failureRedirect: '/'}));

router.get('/steam/return',   passport.authenticate('steam', { failureRedirect: '/'}), authReturn);
router.post('/steam/logout', logout);
router.get('/steam/checkAuthenticated', checkAuth);
router.post('/deleteAccount', deleteAccount)


export default router;