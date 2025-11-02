import fs from 'fs/promises';

const INPUT_FILE = '../database/yugioh_card_data.json';
const OUTPUT_FILE = '../database/yugioh_card_data_unique.json';

async function main() {
    // Read the JSON file
    const data = JSON.parse(await fs.readFile(INPUT_FILE, 'utf8'));

    // Check the structure
    console.log(`Total entries: ${data.length}`);
    console.log(`First entry keys: ${data.length > 0 ? Object.keys(data[0]).join(', ') : 'No data'}`);

    // Remove duplicates based on card ID or name
    const seen = new Set();
    const uniqueData = [];

    for (const card of data) {
        // Use card 'id' as the unique identifier (or 'name' if no id exists)
        const identifier = card.id || card.name;

        if (!seen.has(identifier)) {
            seen.add(identifier);
            uniqueData.push(card);
        }
    }

    console.log(`Unique entries: ${uniqueData.length}`);
    console.log(`Duplicates removed: ${data.length - uniqueData.length}`);

    // Save the deduplicated data
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(uniqueData, null, 2), 'utf8');

    console.log(`✅ Saved to '${OUTPUT_FILE}'`);
}

main().catch(e => {
    console.error('❌ Error:', e);
});