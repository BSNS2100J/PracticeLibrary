// DOM要素の取得
const fileInput = document.getElementById('csv-file');
const tableContainer = document.getElementById('table-container');
const fileInfo = document.getElementById('file-info');
const stats = document.getElementById('stats');
const rowCount = document.getElementById('row-count');
const searchInput = document.getElementById('search-input');
const searchSection = document.getElementById('search-section');
const searchResults = document.getElementById('search-results');

// グローバル変数
let currentBooks = [];
let currentTimestamp = null;
let serverAvailable = false;

// イベントリスナー
fileInput.addEventListener('change', handleFileSelect);
searchInput.addEventListener('input', filterTable);

// ページ読み込み時
window.addEventListener('DOMContentLoaded', () => {
    loadDataFromCSV();
    checkServerStatus();
});

/**
 * サーバーステータスをチェック
 */
async function checkServerStatus() {
    try {
        const response = await fetch('http://localhost:3000/api/books', { timeout: 2000 });
        if (response.ok) {
            serverAvailable = true;
            console.log('✅ サーバー接続成功');
        }
    } catch (error) {
        serverAvailable = false;
        console.log('⚠️ サーバーに接続できません。読み込みモードで動作します。');
    }
}

/**
 * data.csv をファイルから読み込む（初期表示）
 */
async function loadDataFromCSV() {
    try {
        const response = await fetch('./data.csv');
        if (!response.ok) {
            throw new Error('data.csv が見つかりません');
        }
        const csvText = await response.text();
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                currentBooks = results.data;
                currentTimestamp = new Date().getTime();
                fileInfo.textContent = '📄 data.csv（ファイルから読み込み）';
                displayTable(currentBooks);
                updateStats(currentBooks);
            },
            error: function(error) {
                tableContainer.innerHTML = `<div class="empty-state"><p>❌ data.csv の読み込みに失敗しました。</p></div>`;
            }
        });
    } catch (error) {
        tableContainer.innerHTML = `<div class="empty-state"><p>❌ データファイルが見つかりません。<br>CSVファイルを読み込んでください。</p></div>`;
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
            if (confirm(`${results.data.length}件のデータをインポートしますか？`)) {
                currentBooks = results.data;
                currentTimestamp = null;
                displayTable(currentBooks);
                updateStats(currentBooks);
                alert('✅ CSVデータを読み込みました！');
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
    
    ['タイトル', '著者', '発行年', 'ISBNコード', '操作'].forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // データ行
    const tbody = document.createElement('tbody');
    books.forEach((book, index) => {
        const tr = document.createElement('tr');
        
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
        actionCell.innerHTML = `
            <a href="edit.html?index=${index}" class="btn-edit">✏️ 編集</a>
            <button class="btn-delete" onclick="deleteBook(${index})">🗑️ 削除</button>
        `;
        tr.appendChild(actionCell);
        
        tbody.appendChild(tr);
    });

    table.appendChild(thead);
    table.appendChild(tbody);

    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);

    // ボタン・検索を表示
    searchSection.style.display = 'flex';
}

/**
 * 統計情報を更新
 */
function updateStats(books) {
    rowCount.textContent = `📊 登録図書数: ${books.length}件`;
    stats.style.display = 'flex';
}

/**
 * 図書を削除
 */
async function deleteBook(index) {
    if (!confirm('この図書を削除してもよろしいですか？')) {
        return;
    }

    // サーバーで削除を試みる
    if (serverAvailable) {
        try {
            const response = await fetch(`http://localhost:3000/api/books/${index}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timestamp: currentTimestamp })
            });

            const data = await response.json();

            if (!response.ok) {
                alert('❌ ' + data.error);
                if (response.status === 409) {
                    loadDataFromCSV();
                }
                return;
            }

            alert('✅ 削除完了\n図書情報を削除しました。');
            loadDataFromCSV();
        } catch (error) {
            console.log('サーバーエラー。ローカル削除へ切り替え。');
            deleteLocalBook(index);
        }
    } else {
        // サーバーなしはローカル削除のみ
        deleteLocalBook(index);
    }
}

/**
 * ローカルで図書を削除（サーバーなし時）
 */
function deleteLocalBook(index) {
    currentBooks.splice(index, 1);
    displayTable(currentBooks);
    updateStats(currentBooks);
    alert('✅ 削除完了\n図書情報を削除しました。');
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
 * ファイルサイズをフォーマット
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
