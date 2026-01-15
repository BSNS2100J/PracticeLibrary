// DOM要素の取得
const fileInput = document.getElementById('csv-file');
const tableContainer = document.getElementById('table-container');
const fileInfo = document.getElementById('file-info');
const clearBtn = document.getElementById('clear-btn');
const stats = document.getElementById('stats');
const rowCount = document.getElementById('row-count');
const colCount = document.getElementById('col-count');
const searchInput = document.getElementById('search-input');
const searchSection = document.getElementById('search-section');
const searchResults = document.getElementById('search-results');

// ファイル選択時のイベントリスナー
fileInput.addEventListener('change', handleFileSelect);

// クリアボタンのイベントリスナー
clearBtn.addEventListener('click', clearTable);

// 検索入力時のイベントリスナー
searchInput.addEventListener('input', filterTable);

/**
 * ファイル選択時の処理
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }

    // ファイル情報を表示
    fileInfo.textContent = `📄 ${file.name} (${formatFileSize(file.size)})`;

    // FileReaderでCSVファイルを読み込む
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const csvText = e.target.result;
        parseAndDisplayCSV(csvText);
    };

    reader.onerror = function() {
        alert('ファイルの読み込みに失敗しました。');
    };

    reader.readAsText(file, 'UTF-8');
}

/**
 * CSVをパースしてテーブルに表示
 */
function parseAndDisplayCSV(csvText) {
    // Papa Parseでパース
    Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            displayTable(results.data);
            updateStats(results.data);
        },
        error: function(error) {
            alert('CSVの解析に失敗しました: ' + error.message);
        }
    });
}

/**
 * テーブルを生成して表示
 */
function displayTable(data) {
    // テーブル要素を作成
    const table = document.createElement('table');
    
    // ヘッダー行を作成
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    // 行ナンバー列のヘッダーを追加
    const rowNumberHeader = document.createElement('th');
    rowNumberHeader.textContent = '#';
    rowNumberHeader.classList.add('row-number-header');
    headerRow.appendChild(rowNumberHeader);
    
    // ヘッダーを取得
    const headers = data.length > 0 ? Object.keys(data[0]) : [];
    headers.forEach(cell => {
        const th = document.createElement('th');
        th.textContent = cell;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    // データ行を作成
    const tbody = document.createElement('tbody');
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        
        // 行ナンバーセルを追加
        const rowNumberCell = document.createElement('td');
        rowNumberCell.textContent = index + 1;
        rowNumberCell.classList.add('row-number-cell');
        tr.appendChild(rowNumberCell);
        
        Object.values(row).forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    // テーブルを組み立て
    table.appendChild(thead);
    table.appendChild(tbody);

    // コンテナをクリアして新しいテーブルを挿入
    tableContainer.innerHTML = '';
    tableContainer.appendChild(table);

    // 統計情報を表示
    showStats(data.length, headers.length);

    // クリアボタンと検索セクションを表示
    clearBtn.style.display = 'inline-block';
    searchSection.style.display = 'flex';
    
    // 検索入力をリセット
    searchInput.value = '';
    searchResults.textContent = '';
}

/**
 * 統計情報を表示
 */
function showStats(rows, cols) {
    rowCount.textContent = `📊 データ行数: ${rows}`;
    colCount.textContent = `📋 列数: ${cols}`;
    stats.style.display = 'flex';
}

/**
 * テーブルをフィルタリング（検索）
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
    
    // 検索結果を表示
    if (searchTerm === '') {
        searchResults.textContent = '';
    } else {
        searchResults.textContent = `マッチ: ${visibleCount}件`;
    }
}

/**
 * テーブルをクリア
 */
function clearTable() {
    tableContainer.innerHTML = `
        <div class="empty-state">
            <p>👆 CSVファイルを選択してください</p>
        </div>
    `;
    fileInfo.textContent = '';
    fileInput.value = '';
    clearBtn.style.display = 'none';
    searchSection.style.display = 'none';
    stats.style.display = 'none';
    searchInput.value = '';
    searchResults.textContent = '';
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
