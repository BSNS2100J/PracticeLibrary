/**
 * LocalStorageを使ったデータ管理モジュール
 */

const STORAGE_KEY = 'bookData';

/**
 * 全図書データを取得
 */
function getAllBooks() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * 全図書データを保存
 */
function saveAllBooks(books) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

/**
 * 図書データを追加
 */
function addBook(book) {
    const books = getAllBooks();
    // IDを自動生成
    book.id = Date.now().toString();
    books.push(book);
    saveAllBooks(books);
    return book;
}

/**
 * 指定IDの図書データを取得
 */
function getBookById(id) {
    const books = getAllBooks();
    return books.find(book => book.id === id);
}

/**
 * 図書データを更新
 */
function updateBook(id, updatedBook) {
    const books = getAllBooks();
    const index = books.findIndex(book => book.id === id);
    if (index !== -1) {
        books[index] = { ...books[index], ...updatedBook, id };
        saveAllBooks(books);
        return true;
    }
    return false;
}

/**
 * 図書データを削除
 */
function deleteBook(id) {
    const books = getAllBooks();
    const filteredBooks = books.filter(book => book.id !== id);
    saveAllBooks(filteredBooks);
    return filteredBooks.length < books.length;
}

/**
 * CSVデータをインポート
 */
function importFromCSV(csvData) {
    const books = csvData.map(book => ({
        ...book,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));
    saveAllBooks(books);
}

/**
 * 全データをクリア
 */
function clearAllBooks() {
    localStorage.removeItem(STORAGE_KEY);
}
