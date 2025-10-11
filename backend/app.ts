import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../frontend/public')));

// API routes
// app.get('/api/health', (req: Request, res: Response) => {
//     res.json({ status: 'OK', message: 'Yugioh app is running' });
// });

// Serve React app for all other routes
app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Yugioh app server running on port ${PORT}`);
});
