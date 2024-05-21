// src/app.ts
import express from 'express';
import cors from 'cors';
import env from 'dotenv';
import gameRoutes from './routes/gameRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';

env.config();

const app = express();

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));

app.use('/api/games', gameRoutes);
app.use('/api/achievements', achievementRoutes);

export default app;