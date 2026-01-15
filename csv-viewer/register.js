// DOM要素の取得
const registerForm = document.getElementById('register-form');
const clearBtn = document.getElementById('clear-btn');

// イベントリスナー
registerForm.addEventListener('submit', handleSubmit);
clearBtn.addEventListener('click', clearForm);

/**
 * フォーム送信処理
 */
function handleSubmit(event) {
    event.preventDefault();
    
    // バリデーション
    if (!validateForm()) {
        return;
    }
    
    // データ取得
    const bookData = {
        'タイトル': document.getElementById('title').value.trim(),
        '著者': document.getElementById('author').value.trim(),
        '発行年': document.getElementById('year').value.trim(),
        'ISBNコード': document.getElementById('isbn').value.trim()
    };
    
    // 確認メッセージ
    const confirmMessage = `以下の図書情報を登録してもよろしいですか？\n\nタイトル: ${bookData['タイトル']}\n著者: ${bookData['著者']}\n発行年: ${bookData['発行年']}\nISBNコード: ${bookData['ISBNコード']}`;
    
    if (confirm(confirmMessage)) {
        addBook(bookData);
        // フラグを設定して一覧ページに遷移
        localStorage.setItem('showRegisteredMessage', 'true');
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

/**
 * フォームをクリア
 */
function clearForm() {
    registerForm.reset();
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
    document.getElementById('title').focus();
}
