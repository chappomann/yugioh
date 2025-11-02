import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CARDS_FILE = path.join(__dirname, 'database', 'cards.json');
const YUGIOH_DATA_FILE = path.join(__dirname, 'database', 'yugioh_card_data.json');

async function mergeCardData() {
    try {
        console.log('Loading cards.json...');
        const cardsData = await fs.readFile(CARDS_FILE, 'utf8');
        const cards = JSON.parse(cardsData);

        console.log('Loading yugioh_card_data.json...');
        const yugiohData = await fs.readFile(YUGIOH_DATA_FILE, 'utf8');
        const yugiohCards = JSON.parse(yugiohData);

        console.log(`Found ${cards.length} cards with quantities`);
        console.log(`Found ${yugiohCards.length} Yu-Gi-Oh cards with full data`);

        // Create a map of card quantities for faster lookup
        const quantityMap = new Map();
        cards.forEach(card => {
            quantityMap.set(card.id.toString(), card.quantity);
        });

        console.log('Merging quantity data...');
        let updatedCount = 0;
        let newCount = 0;

        // Update existing cards with quantity data
        yugiohCards.forEach(card => {
            const cardId = card.id.toString();
            if (quantityMap.has(cardId)) {
                card.quantity = quantityMap.get(cardId);
                updatedCount++;
                quantityMap.delete(cardId); // Remove from map to track what's left
            } else if (!card.hasOwnProperty('quantity')) {
                card.quantity = 0; // Set default quantity if not present
                newCount++;
            }
        });

        console.log(`Updated ${updatedCount} existing cards with quantity data`);
        console.log(`Set default quantity for ${newCount} cards`);

        // Check if there are any cards in cards.json that aren't in yugioh_card_data.json
        if (quantityMap.size > 0) {
            console.log(`Warning: ${quantityMap.size} cards from cards.json were not found in yugioh_card_data.json:`);
            for (const [id, quantity] of quantityMap) {
                console.log(`  - ID: ${id}, Quantity: ${quantity}`);
            }
        }

        console.log('Writing merged data back to yugioh_card_data.json...');
        await fs.writeFile(YUGIOH_DATA_FILE, JSON.stringify(yugiohCards, null, 2));

        console.log('✅ Successfully merged card data!');
        console.log(`Total cards in yugioh_card_data.json: ${yugiohCards.length}`);

        // Create a backup of the original cards.json
        const backupFile = path.join(__dirname, 'cards.json.backup');
        await fs.copyFile(CARDS_FILE, backupFile);
        console.log(`📦 Created backup: ${backupFile}`);

    } catch (error) {
        console.error('❌ Error merging card data:', error);
        process.exit(1);
    }
}

mergeCardData();