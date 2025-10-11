import { Router, Request, Response } from 'express';
import { YugiohDatabase } from '../database.js';

const router = Router();
const db = new YugiohDatabase();

/**
 * Get statistics about the user's card collection.
 * @route GET /collection/stats
 * @returns {Object} Collection statistics.
 */
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const stats = await db.getCollectionStats();
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error fetching collection stats:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

/**
 * Get all cards in the user's collection (quantity > 0).
 * @route GET /collection
 * @param {string} [sortBy=name] - Field to sort by.
 * @param {string} [sortOrder=ASC] - Sort order (ASC or DESC).
 * @returns {Object} List of cards in the collection.
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { sortBy = 'name', sortOrder = 'ASC' } = req.query;
        const collection = await db.getCollection(sortBy as string, sortOrder as string);
        res.json({ success: true, collection });
    } catch (error) {
        console.error('Error fetching collection:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

/**
 * Add a card to the collection or increase its quantity.
 * @route POST /collection
 * @body {string} cardId - The card's unique ID.
 * @body {number} quantity - The quantity to add.
 * @returns {Object} Result of the operation.
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const { cardId, quantity } = req.body;
        const result = await db.addToCollection(cardId, quantity);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error adding to collection:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

/**
 * Update the quantity of a card in the collection.
 * @route PUT /collection/:cardId
 * @param {string} cardId - The card's unique ID.
 * @body {number} quantity - The new quantity.
 * @returns {Object} Result of the operation.
 */
router.put('/:cardId', async (req: Request, res: Response) => {
    try {
        const { cardId } = req.params;
        const { quantity } = req.body;
        const result = await db.updateCollectionItem(cardId, quantity);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error updating collection item:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

/**
 * Remove a card from the collection (set quantity to 0).
 * @route DELETE /collection/:cardId
 * @param {string} cardId - The card's unique ID.
 * @returns {Object} Result of the operation.
 */
router.delete('/:cardId', async (req: Request, res: Response) => {
    try {
        const { cardId } = req.params;
        const result = await db.removeFromCollection(cardId);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error removing from collection:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

export default router;
