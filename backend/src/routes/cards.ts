import { Router, Request, Response } from 'express';
import { YugiohDatabase } from '../database.js';
import { CardImportService } from '../utils/card-importer.js';
import { successResponse, errorResponse, ApiResponse } from '../types/api.js';
import { validateQuery, validateParams, validateBody, commonSchemas } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
const db = new YugiohDatabase();
const importService = new CardImportService();

/**
 * Get card import statistics.
 * @route GET /cards/stats
 * @returns {Object} Card import statistics.
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
    try {
        const stats = await importService.getImportStats();
        res.json(successResponse(stats, 'Card statistics retrieved successfully'));
    } catch (error) {
        console.error('Error fetching card stats:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        res.status(500).json(errorResponse('Failed to fetch card statistics', errorMessage));
    }
});

/**
 * Get available filter options for cards.
 * @route GET /cards/filters
 * @returns {Object} Filter options.
 */
router.get('/filters', async (req: Request, res: Response) => {
    try {
        const filters = await db.getFilterOptions();
        res.json({ success: true, filters });
    } catch (error) {
        console.error('Error fetching filters:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

/**
 * Get all cards or search/filter cards.
 * @route GET /cards
 * @param {string} [search] - Search term.
 * @param {string} [type] - Card type.
 * @param {string} [race] - Card race.
 * @param {string} [attribute] - Card attribute.
 * @param {string} [archetype] - Card archetype.
 * @param {number} [minAtk] - Minimum ATK.
 * @param {number} [maxAtk] - Maximum ATK.
 * @param {number} [minDef] - Minimum DEF.
 * @param {number} [maxDef] - Maximum DEF.
 * @param {number} [level] - Card level.
 * @param {number} [limit=50] - Limit results.
 * @param {number} [offset=0] - Offset results.
 * @param {string} [sortBy=name] - Sort by field.
 * @param {string} [sortOrder=ASC] - Sort order.
 * @returns {Object} List of cards and total count.
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const {
            search,
            type,
            race,
            attribute,
            archetype,
            minAtk,
            maxAtk,
            minDef,
            maxDef,
            level,
            limit = '50',
            offset = '0',
            sortBy = 'name',
            sortOrder = 'ASC'
        } = req.query;

        let cards;
        let totalCount;

        if (search || type || race || attribute || archetype || minAtk || maxAtk || minDef || maxDef || level) {
            const filters = {
                search: search as string,
                type: type as string,
                race: race as string,
                attribute: attribute as string,
                archetype: archetype as string,
                minAtk: minAtk ? parseInt(minAtk as string) : null,
                maxAtk: maxAtk ? parseInt(maxAtk as string) : null,
                minDef: minDef ? parseInt(minDef as string) : null,
                maxDef: maxDef ? parseInt(maxDef as string) : null,
                level: level ? parseInt(level as string) : null
            };

            cards = await db.searchCardsAdvanced(
                filters,
                parseInt(limit as string),
                parseInt(offset as string),
                sortBy as string,
                sortOrder as string
            );
            totalCount = await db.getFilteredCardsCount(filters);
        } else {
            cards = await db.getAllCards(
                parseInt(limit as string),
                parseInt(offset as string),
                sortBy as string,
                sortOrder as string
            );
            totalCount = await db.getTotalCardsCount();
        }

        res.json({ success: true, cards, total: totalCount });
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

/**
 * Get a card by its ID.
 * @route GET /cards/:id
 * @param {string} id - Card ID.
 * @returns {Object} Card data.
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const card = await db.getCardById(id);
        if (!card) {
            return res.status(404).json({ success: false, error: 'Card not found' });
        }
        res.json({ success: true, card });
    } catch (error) {
        console.error('Error fetching card:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

/**
 * Add a new card.
 * @route POST /cards
 * @body {Object} Card data.
 * @returns {Object} Result of the operation.
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const result = await db.addCard(req.body);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error adding card:', error);
        res.status(500).json({ success: false, error: (error as Error).message });
    }
});

/**
 * Update the quantity of a card.
 * @route PUT /cards/:id/quantity
 * @param {string} id - Card ID.
 * @body {number} quantity - New quantity.
 * @returns {Object} Result of the operation.
 */
router.put('/:id/quantity',
    validateParams(commonSchemas.cardId),
    validateBody(commonSchemas.quantityUpdate),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const { id } = req.params;
        const { quantity } = req.body;

        const result = await db.updateCardQuantity(id, quantity);
        res.json(successResponse(result, 'Card quantity updated successfully'));
    })
);

export default router;
