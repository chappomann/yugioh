
import { Router, Request, Response } from 'express';
import cardsRouter from './cards.js';
import collectionRouter from './collection.js';
const router = Router();

/**
 * Health check route.
 * @route GET /health
 * @returns {Object} Status and message.
 */
router.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Yugioh app is running' });
});

/**
 * Mounts the cards router on the /cards path.
 * Handles all routes related to Yugioh cards.
 * @see cardsRouter
 */
router.use('/cards', cardsRouter);

/**
 * Mounts the collection router on the /collection path.
 * Handles all routes related to user collections.
 * @see collectionRouter
*/
router.use('/collection', collectionRouter);

/**
 * Fallback route for undefined endpoints.
 * @route ALL *
 * @returns {Object} 404 error message.
 */
router.use('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

export default router;
