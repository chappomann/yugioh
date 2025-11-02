/**
 * tool to get from sql backup
 * sqlite3 yugioh.sqlite "SELECT json_group_array(json_object(
    'id', card_id,
    'quantity', quantity
)) FROM cards;" > cards.json
 */
import fs from 'fs/promises';

const SQL_FILE = '../database/backup.sql';
const OUTPUT_JSON = '../database/cards_full.json';

async function main() {
    const sqlText = await fs.readFile(SQL_FILE, 'utf8');

    // Extract column names from CREATE TABLE statement
    const createTableRegex = /CREATE TABLE cards \(([\s\S]*?)\);/m;
    const createTableMatch = sqlText.match(createTableRegex);
    if (!createTableMatch) {
        console.error('❌ Could not find CREATE TABLE statement.');
        return;
    }
    // Get column lines, remove comments and empty lines
    const columns = createTableMatch[1]
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('--') && !line.startsWith('PRIMARY KEY') && !line.startsWith('UNIQUE') && !line.startsWith('AUTOINCREMENT'))
        .map(line => line.split(' ')[0].replace(',', '').trim())
        .filter(col => col && !col.startsWith('PRIMARY') && !col.startsWith('FOREIGN'));

    // Extract all INSERT statements
    const insertRegex = /INSERT INTO cards VALUES\(([^)]+)\);/g;
    const result = [];

    let match;
    while ((match = insertRegex.exec(sqlText)) !== null) {
        // Split values, handling quoted strings with commas
        const raw = match[1];
        const values = [];
        let buffer = '';
        let inQuotes = false;
        for (let i = 0; i < raw.length; i++) {
            const char = raw[i];
            if (char === "'" && raw[i - 1] !== "\\") {
                inQuotes = !inQuotes;
                buffer += char;
            } else if (char === ',' && !inQuotes) {
                values.push(buffer.trim());
                buffer = '';
            } else {
                buffer += char;
            }
        }
        if (buffer) values.push(buffer.trim());

        // Build card object
        const card = {};
        for (let i = 0; i < columns.length && i < values.length; i++) {
            let val = values[i];
            // Remove surrounding quotes
            if (val.startsWith("'") && val.endsWith("'")) {
                val = val.slice(1, -1).replace(/''/g, "'");
            }
            // Convert numbers
            if (!isNaN(val) && val !== '') {
                val = Number(val);
            }
            // Convert NULL to null
            if (val === 'NULL') val = null;
            card[columns[i]] = val;
        }
        // Move card_id to id and delete card_id
        if (card.card_id !== undefined) {
            card.id = card.card_id;
            delete card.card_id;
        }
        result.push(card);
    }

    await fs.writeFile(OUTPUT_JSON, JSON.stringify(result, null, 2), 'utf8');
    console.log(`✅ Exported ${result.length} full card records to ${OUTPUT_JSON}`);
}

main().catch(e => {
    console.error('❌ Error:', e);
});