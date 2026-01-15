// DOM要素の取得
const fileInput = document.getElementById('csv-file');
const tableContainer = document.getElementById('table-container');
const fileInfo = document.getElementById('file-info');
const clearBtn = document.getElementById('clear-btn');
const deleteBtn = document.getElementById('delete-btn');
const exportBtn = document.getElementById('export-btn');
const stats = document.getElementById('stats');
const rowCount = document.getElementById('row-count');
const searchInput = document.getElementById('search-input');
const searchSection = document.getElementById('search-section');
const searchResults = document.getElementById('search-results');

// イベントリスナー
fileInput.addEventListener('change', handleFileSelect);
clearBtn.addEventListener('click', handleClearAll);
deleteBtn.addEventListener('click', handleDelete);
exportBtn.addEventListener('click', exportToCSV);
searchInput.addEventListener('input', filterTable);

// ページ読み込み時にデータを表示
window.addEventListener('DOMContentLoaded', () => {
    loadAndDisplayBooks();
    
    // 登録完了メッセージを表示
    if (localStorage.getItem('showRegisteredMessage') === 'true') {
        localStorage.removeItem('showRegisteredMessage');
        alert('✅ 登録完了\n図書情報を登録しました。');
    }
    
    // 更新完了メッセージを表示
    if (localStorage.getItem('showUpdatedMessage') === 'true') {
        localStorage.removeItem('showUpdatedMessage');
        alert('✅ 更新完了\n図書情報を更新しました。');
    }
});

/**
 * 図書データを読み込んで表示
 */
function loadAndDisplayBooks() {
    const books = getAllBooks();
    if (books.length > 0) {
        displayTable(books);
        updateStats(books);
    }
}

/**
 * ファイル選択時の処理
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }

    fileInfo.textContent = `📄 ${file.name} (${formatFileSize(file.size)})`;

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const csvText = e.target.result;
        parseAndImportCSV(csvText);
    };

    reader.onerror = function() {
        alert('ファイルの読み込みに失敗しました。');
    };

    reader.readAsText(file, 'UTF-8');
}

/**
 * CSVをパースしてインポート
 */
function parseAndImportCSV(csvText) {
    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            if (confirm(`${results.data.length}件のデータをインポートしますか？\n既存のデータは上書きされます。`)) {
                importFromCSV(results.data);
                loadAndDisplayBooks();
                alert('✅ CSVデータをインポートしました！');
            }
        },
        error: function(error) {
            alert('CSVの解析に失敗しました: ' + error.message);
        }
    });
}

/**
 * テーブルを生成して表示
 */
function displayTable(books) {
    const table = document.createElement('table');
    
    // ヘッダー行
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // 選択列
    const selectHeader = document.createElement('th');
    selectHeader.textContent = '選択';
    headerRow.appendChild(selectHeader);
    
    // データ列
    ['タイトル', '著者', '発行年', 'ISBNコード', '操作'].forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // データ行
    const tbody = document.createElement('tbody');
    books.forEach(book => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        
        // ラジオボタン
        const radioCell = document.createElement('td');
        const radioId = `radio-${book.id}`;
        radioCell.innerHTML = `<input type="radio" name="selected-book" id="${radioId}" value="${book.id}" />`;
        tr.appendChild(radioCell);
        
        // データセル
        ['タイトル', '著者', '発行年', 'ISBNコード'].forEach(key => {
            const td = document.createElement('td');
            td.textContent = book[key] || '';
            td.classList.add('data-cell');
            tr.appendChild(td);
        });
        
        // 操作ボタン
        const actionCell = document.createElement('td');
        actionCell.classList.add('action-cell');
        actionCell.innerHTML = `<a href="edit.html?id=${book.id}" class="btn-edit">✏️ 編集</a>`;
        tr.appendChild(actionCell);
        
        // 行クリックでラジオボタンを選択
        tr.addEventListener('click', (e) => {
            // 編集リンクをクリックした場合は除外
            if (e.target.tagName === 'A' || e.target.closest('a')) {
                return;
            }
            const radio = document.getElementById(radioId);
            radio.checked = true;
            deleteBtn.disabled = false;
        });
        
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);

    // ラジオボタンの変更を監視
    document.querySelectorAll('input[name="selected-book"]').forEach(radio => {
        radio.addEventListener('change', () => {
            deleteBtn.disabled = false;
        });
    });

    // ボタンを表示
    clearBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'inline-block';
    exportBtn.style.display = 'inline-block';
    searchSection.style.display = 'flex';
    deleteBtn.disabled = true;
}

/**
 * 統計情報を更新
 */
function updateStats(books) {
    rowCount.textContent = `📊 登録図書数: ${books.length}件`;
    stats.style.display = 'flex';
}

/**
 * 選択した図書を削除
 */
function handleDelete() {
    const selectedRadio = document.querySelector('input[name="selected-book"]:checked');
    
    if (!selectedRadio) {
        alert('削除する図書を選択してください。');
        return;
    }
    
    if (confirm('選択した図書情報を削除してもよろしいですか？')) {
        const bookId = selectedRadio.value;
        deleteBook(bookId);
        loadAndDisplayBooks();
        alert('✅ 削除完了\n図書情報を削除しました。');
    }
}

/**
 * 全データをクリア
 */
function handleClearAll() {
    if (confirm('全ての図書情報を削除してもよろしいですか？\nこの操作は取り消せません。')) {
        clearAllBooks();
        tableContainer.innerHTML = '<div class="empty-state"><p>👆 CSVファイルを読み込むか、<a href="register.html">新規登録</a>してください</p></div>';
        stats.style.display = 'none';
        clearBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
        exportBtn.style.display = 'none';
        searchSection.style.display = 'none';
        alert('✅ 全データを削除しました。');
    }
}

/**
 * 検索フィルタリング
 */
function filterTable(event) {
    const searchTerm = event.target.value.toLowerCase();
    const rows = document.querySelectorAll('tbody tr');
    let visibleCount = 0;
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isMatch = text.includes(searchTerm);
        row.style.display = isMatch ? '' : 'none';
        if (isMatch) visibleCount++;
    });
    
    searchResults.textContent = searchTerm === '' ? '' : `マッチ: ${visibleCount}件`;
}

/**
 * CSVエクスポート
 */
function exportToCSV() {
    const books = getAllBooks();
    const csvData = books.map(book => ({
        'タイトル': book['タイトル'],
        '著者': book['著者'],
        '発行年': book['発行年'],
        'ISBNコード': book['ISBNコード']
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `図書情報_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ CSVファイルをダウンロードしました！');
}

/**
 * ファイルサイズをフォーマット
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
