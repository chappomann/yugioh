import fs from 'fs/promises';
import fsSync from 'fs'; // Add this for createWriteStream
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const YUGIOH_CARD_DATA_JSON = '../database/yugioh_card_data.json';
const IMAGES_DIR = '../../frontend/images/cards';

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const stream = fsSync.createWriteStream(filepath);
            response.pipe(stream);

            stream.on('finish', () => {
                stream.close();
                resolve();
            });

            stream.on('error', (err) => {
                fs.unlink(filepath).catch(() => { });
                reject(err);
            });
        }).on('error', reject);
    });
}

async function main() {
    // Load card data
    const cardsText = await fs.readFile(YUGIOH_CARD_DATA_JSON, 'utf8');
    const cards = JSON.parse(cardsText);

    // Create images directory if it doesn't exist
    await fs.mkdir(path.resolve(__dirname, IMAGES_DIR), { recursive: true });

    let downloadedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    console.log(`📥 Starting download of ${cards.length} card images...`);

    for (const card of cards) {
        if (!card.id || !card.card_images || !Array.isArray(card.card_images)) {
            skippedCount++;
            continue;
        }

        // Download each image for this card
        for (const image of card.card_images) {
            if (!image.image_url) continue;

            const filename = `${card.id}.jpg`;
            const filepath = path.resolve(__dirname, IMAGES_DIR, filename);

            // Check if file already exists
            try {
                await fs.access(filepath);
                console.log(`⏭️  Skipping ${filename} (already exists)`);
                skippedCount++;
                continue;
            } catch {
                // File doesn't exist, proceed with download
            }

            try {
                await downloadImage(image.image_url, filepath);
                console.log(`✅ Downloaded ${filename}`);
                downloadedCount++;
            } catch (error) {
                console.error(`❌ Failed to download ${filename}:`, error.message);
                errorCount++;
            }
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Downloaded: ${downloadedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Errors: ${errorCount}`);
}

main().catch(e => {
    console.error('❌ Error:', e);
});