// src/index.ts
import app from './app.js';

const port = 5432;

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});

