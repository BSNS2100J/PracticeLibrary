// URLからインデックスを取得
const urlParams = new URLSearchParams(window.location.search);
const bookIndex = parseInt(urlParams.get('index'));

// DOM要素の取得
const detailView = document.getElementById('detail-view');
const editForm = document.getElementById('edit-form');
const editModeBtn = document.getElementById('edit-mode-btn');
const cancelBtn = document.getElementById('cancel-btn');

let currentBook = null;
let currentTimestamp = null;

// イベントリスナー
editModeBtn.addEventListener('click', showEditMode);
cancelBtn.addEventListener('click', showDetailMode);
editForm.addEventListener('submit', handleUpdate);

// ページ読み込み時
window.addEventListener('DOMContentLoaded', () => {
    if (isNaN(bookIndex)) {
        alert('図書インデックスが指定されていません。');
        window.location.href = 'index.html';
        return;
    }
    
    loadBookData();
});

/**
 * 図書データを読み込む
 */
async function loadBookData() {
    try {
        // サーバーからタイムスタンプを取得
        const apiResponse = await fetch('/api/books');
        if (!apiResponse.ok) throw new Error('APIエラー');
        const apiData = await apiResponse.json();
        currentTimestamp = apiData.timestamp;  // ← サーバーから取得
        
        // CSVはローカルで読み込み
        const csvResponse = await fetch('./data.csv');
        if (!csvResponse.ok) throw new Error('読み込みエラー');
        
        const csvText = await csvResponse.text();
        
        return new Promise((resolve) => {
            Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    const books = results.data;
                    
                    if (bookIndex < 0 || bookIndex >= books.length) {
                        alert('指定された図書が見つかりません。');
                        window.location.href = 'index.html';
                        return;
                    }
                    
                    currentBook = books[bookIndex];
                    displayBookDetail();
                    resolve();
                },
                error: function(error) {
                    alert('❌ エラー: ' + error.message);
                    window.location.href = 'index.html';
                }
            });
        });
    } catch (error) {
        alert('❌ エラー: ' + error.message);
        window.location.href = 'index.html';
    }
}

/**
 * 詳細表示
 */
function displayBookDetail() {
    document.getElementById('detail-title').textContent = currentBook['タイトル'] || '';
    document.getElementById('detail-author').textContent = currentBook['著者'] || '';
    document.getElementById('detail-year').textContent = currentBook['発行年'] || '';
    document.getElementById('detail-isbn').textContent = currentBook['ISBNコード'] || '';
}

/**
 * 編集モードを表示
 */
function showEditMode() {
    // フォームに現在の値をセット
    document.getElementById('title').value = currentBook['タイトル'] || '';
    document.getElementById('author').value = currentBook['著者'] || '';
    document.getElementById('year').value = currentBook['発行年'] || '';
    document.getElementById('isbn').value = currentBook['ISBNコード'] || '';
    
    // 表示を切り替え
    detailView.style.display = 'none';
    editForm.style.display = 'block';
    document.getElementById('title').focus();
}

/**
 * 詳細モードを表示
 */
function showDetailMode() {
    editForm.style.display = 'none';
    detailView.style.display = 'block';
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
}

/**
 * 更新処理
 */
async function handleUpdate(event) {
    event.preventDefault();
    
    // バリデーション
    if (!validateForm()) {
        return;
    }
    
    // サーバー接続確認（更新はサーバー必須）
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const checkResponse = await fetch('/api/books', {
            signal: controller.signal
        });
        clearTimeout(timeout);
        
        if (!checkResponse.ok) {
            throw new Error('サーバーに接続できません');
        }
    } catch (error) {
        alert('❌ 更新にはサーバー接続が必須です。\nターミナルで npm start を実行してください。');
        return;
    }
    
    // データ取得
    const updatedData = {
        'タイトル': document.getElementById('title').value.trim(),
        '著者': document.getElementById('author').value.trim(),
        '発行年': document.getElementById('year').value.trim(),
        'ISBNコード': document.getElementById('isbn').value.trim()
    };
    
    // 確認メッセージ
    const confirmMessage = `以下の内容で図書情報を更新してもよろしいですか？\n\nタイトル: ${updatedData['タイトル']}\n著者: ${updatedData['著者']}\n発行年: ${updatedData['発行年']}\nISBNコード: ${updatedData['ISBNコード']}`;
    
    if (confirm(confirmMessage)) {
        try {
            const response = await fetch(`/api/books/${bookIndex}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timestamp: currentTimestamp,
                    book: updatedData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                alert('❌ ' + data.error);
                if (response.status === 409) {
                    // タイムスタンプエラー：再度読み込み
                    loadBookData();
                }
                return;
            }

            alert('✅ 更新完了\n図書情報を更新しました。');
            window.location.href = 'index.html';
        } catch (error) {
            alert('❌ エラー: ' + error.message);
        }
    }
}

/**
 * バリデーション（必須: タイトルのみ）
 */
function validateForm() {
    let isValid = true;
    
    // エラーメッセージをクリア
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // タイトル（必須）
    const title = document.getElementById('title').value.trim();
    if (!title) {
        showError('title-error', 'タイトルを入力してください。');
        isValid = false;
    }
    
    // 発行年（オプション、入力時は形式チェック）
    const year = document.getElementById('year').value.trim();
    if (year) {
        if (!/^\d{4}$/.test(year)) {
            showError('year-error', '発行年は4桁の数字で入力してください。');
            isValid = false;
        } else {
            const yearNum = parseInt(year);
            const currentYear = new Date().getFullYear();
            if (yearNum < 1000 || yearNum > currentYear + 1) {
                showError('year-error', `発行年は1000〜${currentYear + 1}の範囲で入力してください。`);
                isValid = false;
            }
        }
    }
    
    // ISBNコード（オプション、入力時は形式チェック）
    const isbn = document.getElementById('isbn').value.trim();
    if (isbn) {
        if (!/^978-\d-\d{2}-\d{6}-\d$/.test(isbn) && !/^\d{13}$/.test(isbn.replace(/-/g, ''))) {
            showError('isbn-error', 'ISBNコードの形式が正しくありません。（例: 978-4-06-182009-8）');
            isValid = false;
        }
    }
    
    return isValid;
}

/**
 * エラーメッセージを表示
 */
function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}
