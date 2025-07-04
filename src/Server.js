import express from 'express';
import dbConnect from './utils/dbConnect.js';

const app = express();

// Middleware to connect to the database
app.use(async (req, res, next) => {
    try {
        await dbConnect();
        next();
    } catch (error) {
        res.status(500).send('Database connection error', error.message);
    }
});

// Example route
app.get('/', (req, res) => {
    res.send('Hello, MongoDB!');
});

const PORT = process.env.PORT || 4000; // Avoid conflict with Next.js
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
