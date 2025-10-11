import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const sqlite = sqlite3.verbose();

interface DatabaseResult {
    id?: number;
    changes?: number;
}
/**
 * Utility class for managing SQLite database connections and operations.
 * Provides methods to connect, close, run queries, and initialize tables for the Yugioh app.
 */
export class DatabaseUtils {
    protected dbPath: string;
    protected db: sqlite3.Database | null;

    constructor(dbPath: string) {
        this.dbPath = dbPath;
        this.db = null;
    }

    /**
     * Connect to the SQLite database.
     * @returns {Promise<sqlite3.Database>} Resolves with the database instance when connected.
     */
    connect(): Promise<sqlite3.Database> {
        return new Promise((resolve, reject) => {
            this.db = new sqlite.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error connecting to database:', err);
                    reject(err);
                } else {
                    console.log(`Connected to SQLite database: ${this.dbPath}`);
                    resolve(this.db!);
                }
            });
        });
    }

    /**
     * Close the database connection if open.
     * @returns {Promise<void>} Resolves when the connection is closed.
     */
    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('Error closing database:', err);
                        reject(err);
                    } else {
                        console.log('Database connection closed');
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    /**
     * Execute a SQL query (INSERT, UPDATE, DELETE).
     * @param {string} sql - The SQL statement to execute.
     * @param {any[]} [params=[]] - Parameters for the SQL statement.
     * @returns {Promise<DatabaseResult>} Result with last insert id and changes.
     */
    run(sql: string, params: any[] = []): Promise<DatabaseResult> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.run(sql, params, function (err) {
                if (err) {
                    console.error('Database run error:', err);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    /**
     * Get a single row from the database.
     * @param {string} sql - The SQL SELECT statement.
     * @param {any[]} [params=[]] - Parameters for the SQL statement.
     * @returns {Promise<any>} The row result or undefined if not found.
     */
    get(sql: string, params: any[] = []): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('Database get error:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * Get all rows from the database for a query.
     * @param {string} sql - The SQL SELECT statement.
     * @param {any[]} [params=[]] - Parameters for the SQL statement.
     * @returns {Promise<any[]>} Array of row results.
     */
    all(sql: string, params: any[] = []): Promise<any[]> {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('Database not connected'));
                return;
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Database all error:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    /**
     * Check if the database connection is open.
     * @returns {boolean} True if connected, false otherwise.
     */
    isConnected(): boolean {
        return this.db !== null;
    }

    /**
     * Initialize all required tables and indexes in the database for a specific application.
     * @param {string} appName - The application name (e.g., 'yugioh', 'friendreview', 'gamecollection', 'homebudget', 'quizgame').
     * @returns {Promise<void>} Resolves when initialization is complete.
     */
    async initializeTables(appName: string): Promise<void> {
        try {
            await this.connect();

            if (appName === 'yugioh') {
                // Yugioh: Cards table
                await this.run(`
                    CREATE TABLE IF NOT EXISTS cards (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        card_id TEXT UNIQUE NOT NULL,
                        name TEXT NOT NULL,
                        type TEXT,
                        race TEXT,
                        archetype TEXT,
                        atk INTEGER,
                        def INTEGER,
                        level INTEGER,
                        attribute TEXT,
                        description TEXT,
                        image_url TEXT,
                        price REAL,
                        quantity INTEGER DEFAULT 0,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `);

                // Create indexes for better search performance
                await this.run(`CREATE INDEX IF NOT EXISTS idx_cards_name ON cards(name)`);
                await this.run(`CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type)`);
                await this.run(`CREATE INDEX IF NOT EXISTS idx_cards_race ON cards(race)`);
                await this.run(`CREATE INDEX IF NOT EXISTS idx_cards_attribute ON cards(attribute)`);
                await this.run(`CREATE INDEX IF NOT EXISTS idx_cards_archetype ON cards(archetype)`);

                console.log('Yugioh database tables initialized successfully');
            } else if (appName === 'friendreview') {
                // Placeholder: Friend Review app tables
                // TODO: Implement actual schema for friendreview
                await this.run(`CREATE TABLE IF NOT EXISTS friend_review_placeholder (id INTEGER PRIMARY KEY AUTOINCREMENT, note TEXT)`);
                console.log('Friend Review placeholder table initialized');
            } else if (appName === 'gamecollection') {
                // Placeholder: Game Collection app tables
                // TODO: Implement actual schema for gamecollection
                await this.run(`CREATE TABLE IF NOT EXISTS game_collection_placeholder (id INTEGER PRIMARY KEY AUTOINCREMENT, note TEXT)`);
                console.log('Game Collection placeholder table initialized');
            } else if (appName === 'homebudget') {
                // Placeholder: Home Budget app tables
                // TODO: Implement actual schema for homebudget
                await this.run(`CREATE TABLE IF NOT EXISTS home_budget_placeholder (id INTEGER PRIMARY KEY AUTOINCREMENT, note TEXT)`);
                console.log('Home Budget placeholder table initialized');
            } else if (appName === 'quizgame') {
                // Placeholder: Quiz Game app tables
                // TODO: Implement actual schema for quizgame
                await this.run(`CREATE TABLE IF NOT EXISTS quiz_game_placeholder (id INTEGER PRIMARY KEY AUTOINCREMENT, note TEXT)`);
                console.log('Quiz Game placeholder table initialized');
            } else {
                throw new Error(`Unknown appName: ${appName}`);
            }
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }
}

/**
 * Backup all .sqlite files from the database folder to the database/backups folder.
 * Each backup file will have a timestamp appended to its name.
 * @param {string} databaseFolder - The path to the folder containing .sqlite files.
 * @param {string} backupFolder - The path to the backup folder.
 */
export function backupAllSqliteFiles(databaseFolder: string, backupFolder: string): void {
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    const files = fs.readdirSync(databaseFolder);
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').replace('T', '_').slice(0, 15);
    console.log(`files in ${databaseFolder}:`, files);
    files.forEach(file => {
        if (file.endsWith('.sqlite')) {
            console.log(`file: ${file}`);
            const src = path.join(databaseFolder, file);
            const dest = path.join(
                backupFolder,
                `${path.parse(file).name}_backup_${timestamp}.sqlite`
            );
            fs.copyFileSync(src, dest);
            console.log(`Backed up ${file} to ${dest}`);
        }
    });
}

// --- CLI Support ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (import.meta.url === `file://${process.argv[1]}`) {
    // Simple CLI: ts-node database-utils.ts -arg=backup
    const arg = process.argv.find(a => a.startsWith('-arg='))?.split('=')[1];

    const databaseFolder = path.resolve(__dirname, '../../../../../databases');
    const backupFolder = path.resolve(__dirname, '../../../../../databases/backups');
    if (arg === 'backup') {
        backupAllSqliteFiles(databaseFolder, backupFolder);
    } else {
        console.log('Usage: ts-node database-utils.ts -arg=backup');
        // Add more commands here as needed
    }
}
