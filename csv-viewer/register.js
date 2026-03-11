// DOM要素の取得
const registerForm = document.getElementById('register-form');
const clearBtn = document.getElementById('clear-btn');

// イベントリスナー
registerForm.addEventListener('submit', handleSubmit);
clearBtn.addEventListener('click', clearForm);

/**
 * フォーム送信処理
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    // バリデーション
    if (!validateForm()) {
        return;
    }
    
    // サーバー接続確認（登録はサーバー必須）
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
        alert('❌ 登録にはサーバー接続が必須です。\nターミナルで npm start を実行してください。');
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
        try {
            const response = await fetch('/api/books', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bookData)
            });

            const data = await response.json();

            if (!response.ok) {
                alert('❌ ' + data.error);
                return;
            }

            alert('✅ 登録完了\n図書情報を登録しました。');
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
