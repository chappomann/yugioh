import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { YugiohDatabase } from './database.js';
import apiRoutes from './routes/index.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database
const db = new YugiohDatabase();

// Initialize database tables
db.initializeTables('yugioh').catch(console.error);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(process.cwd(), '../frontend/public')));

// API routes
app.use('/api', apiRoutes);

// Serve React app for all other routes
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), '../frontend/public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Yugioh app server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

export default app;
