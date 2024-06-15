// src/index.ts

import app from './app.js';

const SERVER_PORT = parseInt(process.env.SERVER_PORT as string) || 5432;

app.listen(SERVER_PORT, () => {
    console.log(`Server running on port: ${SERVER_PORT}`);
});

