import fs from 'fs/promises';

const CARDS_JSON = '../database/cards.json';
const YUGIOH_CARD_DATA_JSON = '../database/yugioh_card_data.json';
const OUTPUT_FILE = '../database/yugioh_card_data.json'; // overwrite original

async function main() {
    // Load quantities from cards.json
    const cardsText = await fs.readFile(CARDS_JSON, 'utf8');
    const cardsQuantities = JSON.parse(cardsText);

    // Load yugioh_card_data.json
    const yugiohText = await fs.readFile(YUGIOH_CARD_DATA_JSON, 'utf8');
    const yugiohCards = JSON.parse(yugiohText);

    // Update quantities by index
    for (let i = 0; i < yugiohCards.length; i++) {
        if (cardsQuantities[i] && typeof cardsQuantities[i].quantity === 'number') {
            yugiohCards[i].quantity = cardsQuantities[i].quantity;
        }
    }

    await fs.writeFile(OUTPUT_FILE, JSON.stringify(yugiohCards, null, 2), 'utf8');
    console.log(`✅ Quantities updated in ${OUTPUT_FILE}`);
}

main().catch(e => {
    console.error('❌ Error:', e);
});