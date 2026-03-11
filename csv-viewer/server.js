import express from 'express';
import cors from 'cors';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import lockfile from 'proper-lockfile';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.csv');
const LOCK_FILE = path.join(__dirname, 'data.csv.lock');

// ミドルウェア
app.use(cors());
app.use(express.json());

// 静的ファイルの配信
app.use(express.static(__dirname));

// グローバル変数
let books = [];
let lastModifiedTime = null;

/**
 * CSVファイルを読み込む
 */
async function loadCSVData() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            console.log('⚠️  data.csv が見つかりません');
            books = [];
            return;
        }

        books = [];
        const stream = fs.createReadStream(DATA_FILE);
        
        return new Promise((resolve, reject) => {
            stream
                .pipe(csv())
                .on('data', (row) => {
                    books.push(row);
                })
                .on('end', () => {
                    console.log(`✅ ${books.length}件のデータを読み込みました`);
                    resolve();
                })
                .on('error', reject);
        });
    } catch (error) {
        console.error('❌ CSV読み込みエラー:', error.message);
        books = [];
    }
}

/**
 * CSVファイルに書き込む
 */
async function saveCSVData() {
    let release;
    try {
        // ファイルをロック
        release = await lockfile.lock(DATA_FILE);

        if (books.length === 0) {
            await fsp.writeFile(DATA_FILE, '');
            console.log('✅ CSVファイルを保存しました（空）');
            return;
        }

        // ヘッダーを取得
        const headers = Object.keys(books[0]).map(key => ({
            id: key,
            title: key
        }));

        const csvWriter = createObjectCsvWriter({
            path: DATA_FILE,
            header: headers
        });

        await csvWriter.writeRecords(books);
        lastModifiedTime = new Date().getTime();
        console.log('✅ CSVファイルを保存しました');
    } catch (error) {
        console.error('❌ CSV保存エラー:', error.message);
        throw error;
    } finally {
        if (release) {
            await release();
        }
    }
}

/**
 * API: 全図書データを取得
 */
app.get('/api/books', (req, res) => {
    res.json({
        books: books,
        timestamp: lastModifiedTime || new Date().getTime()
    });
});

/**
 * API: 新規図書を追加
 */
app.post('/api/books', async (req, res) => {
    try {
        const newBook = req.body;
        
        // 必須チェック（タイトル）
        if (!newBook['タイトル'] || !newBook['タイトル'].trim()) {
            return res.status(400).json({ error: 'タイトルは必須です' });
        }

        books.push(newBook);
        await saveCSVData();

        res.status(201).json({ 
            success: true, 
            book: newBook,
            timestamp: lastModifiedTime
        });
    } catch (error) {
        console.error('❌ 追加エラー:', error.message);
        res.status(500).json({ error: 'サーバーエラー: ' + error.message });
    }
});

/**
 * API: 図書を更新
 */
app.put('/api/books/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const { timestamp, book: updatedBook } = req.body;

        if (isNaN(index) || index < 0 || index >= books.length) {
            return res.status(404).json({ error: '図書が見つかりません' });
        }

        // タイムスタンプチェック（コンフリクト検出）
        const currentTime = lastModifiedTime || 0;
        if (timestamp && Math.abs(currentTime - timestamp) > 0) {
            // 別のクライアントが編集している場合
            const serverBooks = await loadAndReturnBooks();
            return res.status(409).json({ 
                error: 'ファイルが他で編集されています。',
                books: serverBooks,
                timestamp: currentTime
            });
        }

        // 必須チェック
        if (!updatedBook['タイトル'] || !updatedBook['タイトル'].trim()) {
            return res.status(400).json({ error: 'タイトルは必須です' });
        }

        books[index] = updatedBook;
        await saveCSVData();

        res.json({ 
            success: true, 
            book: updatedBook,
            timestamp: lastModifiedTime
        });
    } catch (error) {
        console.error('❌ 更新エラー:', error.message);
        res.status(500).json({ error: 'サーバーエラー: ' + error.message });
    }
});

/**
 * API: 図書を削除
 */
app.delete('/api/books/:index', async (req, res) => {
    try {
        const index = parseInt(req.params.index);
        const { timestamp } = req.body;

        if (isNaN(index) || index < 0 || index >= books.length) {
            return res.status(404).json({ error: '図書が見つかりません' });
        }

        // タイムスタンプチェック
        const currentTime = lastModifiedTime || 0;
        if (timestamp && Math.abs(currentTime - timestamp) > 0) {
            const serverBooks = await loadAndReturnBooks();
            return res.status(409).json({ 
                error: 'ファイルが他で編集されています。',
                books: serverBooks,
                timestamp: currentTime
            });
        }

        const deletedBook = books.splice(index, 1);
        await saveCSVData();

        res.json({ 
            success: true, 
            deletedBook: deletedBook[0],
            timestamp: lastModifiedTime
        });
    } catch (error) {
        console.error('❌ 削除エラー:', error.message);
        res.status(500).json({ error: 'サーバーエラー: ' + error.message });
    }
});

/**
 * ヘルパー関数: ファイルを再度読み込みして返す
 */
async function loadAndReturnBooks() {
    await loadCSVData();
    return books;
}

/**
 * サーバー起動
 */
async function startServer() {
    await loadCSVData();

    app.listen(PORT, '0.0.0.0', () => {
        console.log('\n==========================================');
        console.log('✅ サーバー起動: http://localhost:3000');
        console.log('==========================================\n');
    });
}

startServer().catch(error => {
    console.error('❌ サーバー起動エラー:', error);
    process.exit(1);
});
