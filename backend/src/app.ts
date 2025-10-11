import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import { config } from 'dotenv';
import { YugiohDatabase } from './database.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"],
            scriptSrc: ["'self'"],
        },
    },
}));

// Compression middleware
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests from this IP, please try again later',
        message: 'Rate limit exceeded'
    }
});
app.use('/api', limiter);

// Initialize database
const db = new YugiohDatabase();

// Initialize database tables
db.initializeTables('yugioh').catch(console.error);

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(process.cwd(), '../frontend/dist')));

// API routes
app.use('/api', apiRoutes);

// Serve React app for all other routes (except API routes)
app.get('*', (req: Request, res: Response) => {
    // Don't serve React app for API routes that weren't matched
    if (req.path.startsWith('/api')) {
        return notFoundHandler(req, res);
    }
    res.sendFile(path.join(process.cwd(), '../frontend/dist/index.html'));
});

// Global error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Yugioh app server running on port ${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await db.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    await db.close();
    process.exit(0);
});

export default app;
