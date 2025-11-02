import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

// The YGOPRODeck API endpoint for fetching all card information.
const API_URL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const OUTPUT_FILE = './database/yugioh_card_data.json';

/**
 * Fetches card data from the YGOPRODeck API, processes it, and saves it to a file using streams.
 */
async function fetchAndSaveCardData() {
    console.log(`1. Fetching card data from ${API_URL}...`);

    try {
        // Step 1: Fetch the data
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // We still use response.json() here because we must process the *entire* array
        // in memory to add the 'quantity' field, which is the current bottleneck.
        const data = await response.json();
        const cardArray = data.data; // The actual array of card objects is nested under 'data'

        if (!Array.isArray(cardArray)) {
            throw new Error('API response format is incorrect: Expected an array under the "data" key.');
        }

        console.log(`2. Successfully fetched ${cardArray.length} cards.`);

        // Step 2: Process the data to add the 'quantity: 0' field
        const processedCards = cardArray.map(card => {
            // Create a new object that includes all existing card properties
            // plus the new 'quantity' field defaulted to 0.
            return {
                ...card,
                quantity: 0
            };
        });

        console.log('3. Data processed successfully, adding default quantity field.');

        // Step 3: Write the processed array to a JSON file using Writable Stream
        // Convert the large JSON string to a Readable stream
        const jsonString = JSON.stringify(processedCards, null, 2);
        const readableJsonStream = Readable.from(jsonString);

        // Create a Writable stream to the file
        const writableFileStream = createWriteStream(OUTPUT_FILE, 'utf8');

        // Use stream.pipeline to pipe the data from the JSON string (Readable) to the file (Writable).
        // This is safer than .pipe() and ensures streams are properly closed.
        await pipeline(readableJsonStream, writableFileStream);

        console.log(`4. ✅ Success! Card inventory template saved to ${OUTPUT_FILE} using streams.`);

    } catch (error) {
        console.error('❌ An error occurred during the process:', error.message);
        console.log('Please ensure you have an active internet connection.');
    }
}

fetchAndSaveCardData();
