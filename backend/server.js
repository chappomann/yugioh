import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const CARDS_FILE = path.join(__dirname, 'database', 'yugioh_card_data.json');

// Middleware
app.use(express.json());
app.use(cors());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Load cards data
let cardsData = [];

// Load cards data
async function loadCards() {
    try {
        // Ensure database directory exists
        const dbDir = path.dirname(CARDS_FILE);
        await fs.mkdir(dbDir, { recursive: true });

        const data = await fs.readFile(CARDS_FILE, 'utf8');
        cardsData = JSON.parse(data);
        console.log(`✅ Loaded ${cardsData.length} cards`);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('⚠️ Cards file not found, starting with empty array');
            cardsData = [];
        } else {
            console.error('❌ Error loading cards:', error);
            cardsData = [];
        }
    }
}

// Save cards data to file
async function saveCards() {
    try {
        console.log(`💾 Attempting to save ${cardsData.length} cards to ${CARDS_FILE}`);

        // Ensure database directory exists
        const dbDir = path.dirname(CARDS_FILE);
        await fs.mkdir(dbDir, { recursive: true });

        await fs.writeFile(CARDS_FILE, JSON.stringify(cardsData, null, 2), 'utf8');
        console.log(`✅ Successfully saved ${cardsData.length} cards`);
        return true;
    } catch (error) {
        console.error('❌ Error saving cards:', error);
        console.error('❌ File path:', CARDS_FILE);
        console.error('❌ Error details:', error.message);
        return false;
    }
}

// Load cards on startup
await loadCards();

// Route: Get all cards
app.get('/api/cards', (req, res) => {
    res.json({
        total: cardsData.length,
        cards: cardsData
    });
});

// Route: Get card by ID
app.get('/api/cards/id/:id', (req, res) => {
    const card = cardsData.find(c => c.id == req.params.id);
    if (card) {
        res.json(card);
    } else {
        res.status(404).json({ error: 'Card not found' });
    }
});

// Route: Update card quantity
app.put('/api/cards/:id/quantity', async (req, res) => {
    try {
        const cardId = req.params.id;
        const { quantity } = req.body;

        if (quantity === undefined || typeof quantity !== 'number' || quantity < 0) {
            return res.status(400).json({ error: 'Invalid quantity. Must be a non-negative number.' });
        }

        const cardIndex = cardsData.findIndex(c => c.id == cardId);

        if (cardIndex === -1) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Update the quantity
        cardsData[cardIndex].quantity = quantity;

        // Save to file
        const saved = await saveCards();

        if (saved) {
            res.json({
                success: true,
                card: cardsData[cardIndex]
            });
        } else {
            console.error(`Failed to save quantity update for card ${cardId}`);
            res.status(500).json({ error: 'Failed to save changes' });
        }
    } catch (error) {
        console.error('Error in PUT /api/cards/:id/quantity:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Route: Increment card quantity
app.post('/api/cards/:id/increment', async (req, res) => {
    const cardId = req.params.id;
    const cardIndex = cardsData.findIndex(c => c.id == cardId);

    if (cardIndex === -1) {
        return res.status(404).json({ error: 'Card not found' });
    }

    // Increment quantity
    cardsData[cardIndex].quantity = (cardsData[cardIndex].quantity || 0) + 1;

    // Save to file
    const saved = await saveCards();

    if (saved) {
        res.json({
            success: true,
            card: cardsData[cardIndex]
        });
    } else {
        res.status(500).json({ error: 'Failed to save changes' });
    }
});

// Route: Decrement card quantity
app.post('/api/cards/:id/decrement', async (req, res) => {
    const cardId = req.params.id;
    const cardIndex = cardsData.findIndex(c => c.id == cardId);

    if (cardIndex === -1) {
        return res.status(404).json({ error: 'Card not found' });
    }

    // Decrement quantity (minimum 0)
    cardsData[cardIndex].quantity = Math.max(0, (cardsData[cardIndex].quantity || 0) - 1);

    // Save to file
    const saved = await saveCards();

    if (saved) {
        res.json({
            success: true,
            card: cardsData[cardIndex]
        });
    } else {
        res.status(500).json({ error: 'Failed to save changes' });
    }
});

// Route: Search cards by name
app.get('/api/cards/search', (req, res) => {
    const { name } = req.query;
    if (!name) {
        return res.status(400).json({ error: 'Name query parameter is required' });
    }

    const results = cardsData.filter(card =>
        card.name && card.name.toLowerCase().includes(name.toLowerCase())
    );

    res.json({
        total: results.length,
        cards: results
    });
});

// Route: Filter cards by attributes
app.get('/api/cards/filter', (req, res) => {
    const {
        type,
        race,
        attribute,
        level,
        atk,
        def,
        archetype,
        quantity_min,
        quantity_max
    } = req.query;

    let filtered = [...cardsData];

    // Filter by type (e.g., "Monster", "Spell", "Trap")
    if (type) {
        filtered = filtered.filter(card =>
            card.type && card.type.toLowerCase().includes(type.toLowerCase())
        );
    }

    // Filter by race (e.g., "Dragon", "Warrior", "Spellcaster")
    if (race) {
        filtered = filtered.filter(card =>
            card.race && card.race.toLowerCase() === race.toLowerCase()
        );
    }

    // Filter by attribute (e.g., "DARK", "LIGHT", "FIRE")
    if (attribute) {
        filtered = filtered.filter(card =>
            card.attribute && card.attribute.toLowerCase() === attribute.toLowerCase()
        );
    }

    // Filter by level
    if (level) {
        filtered = filtered.filter(card => card.level == level);
    }

    // Filter by ATK
    if (atk) {
        filtered = filtered.filter(card => card.atk == atk);
    }

    // Filter by DEF
    if (def) {
        filtered = filtered.filter(card => card.def == def);
    }

    // Filter by archetype
    if (archetype) {
        filtered = filtered.filter(card =>
            card.archetype && card.archetype.toLowerCase().includes(archetype.toLowerCase())
        );
    }

    // Filter by quantity range
    if (quantity_min) {
        filtered = filtered.filter(card =>
            card.quantity !== undefined && card.quantity >= parseInt(quantity_min)
        );
    }
    if (quantity_max) {
        filtered = filtered.filter(card =>
            card.quantity !== undefined && card.quantity <= parseInt(quantity_max)
        );
    }

    res.json({
        total: filtered.length,
        filters: req.query,
        cards: filtered
    });
});

// Route: Get cards by quantity (e.g., cards you own)
app.get('/api/cards/owned', (req, res) => {
    const ownedCards = cardsData.filter(card => card.quantity && card.quantity > 0);
    res.json({
        total: ownedCards.length,
        cards: ownedCards
    });
});

// Route: Get unique values for filtering (helpful for frontend dropdowns)
app.get('/api/cards/metadata', (req, res) => {
    const types = [...new Set(cardsData.map(c => c.type).filter(Boolean))];
    const races = [...new Set(cardsData.map(c => c.race).filter(Boolean))];
    const attributes = [...new Set(cardsData.map(c => c.attribute).filter(Boolean))];
    const archetypes = [...new Set(cardsData.map(c => c.archetype).filter(Boolean))];
    const levels = [...new Set(cardsData.map(c => c.level).filter(Boolean))].sort((a, b) => a - b);

    res.json({
        types,
        races,
        attributes,
        archetypes,
        levels
    });
});

// Route: Home
app.get('/', (req, res) => {
    res.send(`
        <h1>Yu-Gi-Oh! Card API</h1>
        <h2>Available Endpoints:</h2>
        <ul>
            <li>GET /api/cards - Get all cards</li>
            <li>GET /api/cards/id/:id - Get card by ID</li>
            <li>PUT /api/cards/:id/quantity - Update card quantity</li>
            <li>POST /api/cards/:id/increment - Increment card quantity</li>
            <li>POST /api/cards/:id/decrement - Decrement card quantity</li>
            <li>GET /api/cards/search?name=Dark%20Magician - Search by name</li>
            <li>GET /api/cards/filter?type=Monster&race=Dragon - Filter by attributes</li>
            <li>GET /api/cards/owned - Get cards you own (quantity > 0)</li>
            <li>GET /api/cards/metadata - Get unique values for filters</li>
        </ul>
    `);
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Server is running at http://localhost:${port}`);

    // Get local IP
    import('os').then(({ networkInterfaces }) => {
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                if (net.family === 'IPv4' && !net.internal) {
                    console.log(`🌐 Network: http://${net.address}:${port}`);
                }
            }
        }
    });
});