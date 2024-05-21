// src/utils/errorHandler.ts
import { Response } from 'express';

export const handleError = (res: Response, error: Error, message: string) => {
    console.error(message, error);
    res.status(500).send({ error: message });
};