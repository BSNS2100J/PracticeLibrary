// URLからIDを取得
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get('id');

// DOM要素の取得
const detailView = document.getElementById('detail-view');
const editForm = document.getElementById('edit-form');
const editModeBtn = document.getElementById('edit-mode-btn');
const cancelBtn = document.getElementById('cancel-btn');

let currentBook = null;

// イベントリスナー
editModeBtn.addEventListener('click', showEditMode);
cancelBtn.addEventListener('click', showDetailMode);
editForm.addEventListener('submit', handleUpdate);

// ページ読み込み時
window.addEventListener('DOMContentLoaded', () => {
    if (!bookId) {
        alert('図書IDが指定されていません。');
        window.location.href = 'index.html';
        return;
    }
    
    loadBookData();
});

/**
 * 図書データを読み込む
 */
function loadBookData() {
    currentBook = getBookById(bookId);
    
    if (!currentBook) {
        alert('指定された図書が見つかりません。');
        window.location.href = 'index.html';
        return;
    }
    
    displayBookDetail();
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
function handleUpdate(event) {
    event.preventDefault();
    
    // バリデーション
    if (!validateForm()) {
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
        updateBook(bookId, updatedData);
        // フラグを設定して一覧ページに遷移
        localStorage.setItem('showUpdatedMessage', 'true');
        window.location.href = 'index.html';
    }
}

/**
 * バリデーション
 */
function validateForm() {
    let isValid = true;
    
    // エラーメッセージをクリア
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    
    // タイトル
    const title = document.getElementById('title').value.trim();
    if (!title) {
        showError('title-error', 'タイトルを入力してください。');
        isValid = false;
    }
    
    // 著者
    const author = document.getElementById('author').value.trim();
    if (!author) {
        showError('author-error', '著者を入力してください。');
        isValid = false;
    }
    
    // 発行年
    const year = document.getElementById('year').value.trim();
    if (!year) {
        showError('year-error', '発行年を入力してください。');
        isValid = false;
    } else if (!/^\d{4}$/.test(year)) {
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
    
    // ISBNコード
    const isbn = document.getElementById('isbn').value.trim();
    if (!isbn) {
        showError('isbn-error', 'ISBNコードを入力してください。');
        isValid = false;
    } else if (!/^978-\d-\d{2}-\d{6}-\d$/.test(isbn) && !/^\d{13}$/.test(isbn.replace(/-/g, ''))) {
        showError('isbn-error', 'ISBNコードの形式が正しくありません。（例: 978-4-06-182009-8）');
        isValid = false;
    }
    
    return isValid;
}

/**
 * エラーメッセージを表示
 */
function showError(elementId, message) {
    document.getElementById(elementId).textContent = message;
}
