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
const addBtn = document.getElementById('add-btn');
const exportBtn = document.getElementById('export-btn');
const addFormContainer = document.getElementById('add-form-container');
const addBookForm = document.getElementById('add-book-form');
const cancelAddBtn = document.getElementById('cancel-add-btn');

// グローバル変数：現在のデータ
let currentData = [];
let currentHeaders = [];

// ファイル選択時のイベントリスナー
fileInput.addEventListener('change', handleFileSelect);

// クリアボタンのイベントリスナー
clearBtn.addEventListener('click', clearTable);

// 検索入力時のイベントリスナー
searchInput.addEventListener('input', filterTable);

// 新規登録ボタンのイベントリスナー
addBtn.addEventListener('click', showAddForm);

// エクスポートボタンのイベントリスナー
exportBtn.addEventListener('click', exportToCSV);

// フォーム送信のイベントリスナー
addBookForm.addEventListener('submit', handleAddBook);

// キャンセルボタンのイベントリスナー
cancelAddBtn.addEventListener('click', hideAddForm);

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
            currentData = results.data;
            currentHeaders = results.data.length > 0 ? Object.keys(results.data[0]) : [];
            displayTable(currentData);
            updateStats(currentData);
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
    
    // アクション列のヘッダーを追加
    const actionHeader = document.createElement('th');
    actionHeader.textContent = '操作';
    headerRow.appendChild(actionHeader);
    
    thead.appendChild(headerRow);

    // データ行を作成
    const tbody = document.createElement('tbody');
    data.forEach((row, index) => {
        const tr = document.createElement('tr');
        tr.dataset.index = index;
        
        // 行ナンバーセルを追加
        const rowNumberCell = document.createElement('td');
        rowNumberCell.textContent = index + 1;
        rowNumberCell.classList.add('row-number-cell');
        tr.appendChild(rowNumberCell);
        
        Object.values(row).forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            td.classList.add('data-cell');
            tr.appendChild(td);
        });
        
        // アクションセルを追加
        const actionCell = document.createElement('td');
        actionCell.classList.add('action-cell');
        actionCell.innerHTML = `
            <button class="btn-edit" onclick="editRow(${index})">✏️ 編集</button>
            <button class="btn-delete" onclick="deleteRow(${index})">🗑️ 削除</button>
        `;
        tr.appendChild(actionCell);
        
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

    // ボタンを表示
    clearBtn.style.display = 'inline-block';
    searchSection.style.display = 'flex';
    addBtn.style.display = 'inline-block';
    exportBtn.style.display = 'inline-block';
    
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
    addBtn.style.display = 'none';
    exportBtn.style.display = 'none';
    addFormContainer.style.display = 'none';
    currentData = [];
    currentHeaders = [];
}

/**
 * 新規登録フォームを表示
 */
function showAddForm() {
    addFormContainer.style.display = 'block';
    document.getElementById('input-title').focus();
}

/**
 * 新規登録フォームを非表示
 */
function hideAddForm() {
    addFormContainer.style.display = 'none';
    addBookForm.reset();
}

/**
 * 図書情報を追加
 */
function handleAddBook(event) {
    event.preventDefault();
    
    const newBook = {};
    newBook[currentHeaders[0]] = document.getElementById('input-title').value;
    newBook[currentHeaders[1]] = document.getElementById('input-author').value;
    newBook[currentHeaders[2]] = document.getElementById('input-year').value;
    newBook[currentHeaders[3]] = document.getElementById('input-isbn').value;
    
    currentData.push(newBook);
    displayTable(currentData);
    updateStats(currentData);
    hideAddForm();
    
    alert('✅ 図書情報を追加しました！');
}

/**
 * 行を削除
 */
function deleteRow(index) {
    if (confirm('この図書情報を削除してもよろしいですか？')) {
        currentData.splice(index, 1);
        displayTable(currentData);
        updateStats(currentData);
        alert('✅ 図書情報を削除しました！');
    }
}

/**
 * 行を編集
 */
function editRow(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    const cells = row.querySelectorAll('.data-cell');
    const originalValues = [];
    
    // セルを入力フィールドに変換
    cells.forEach((cell, i) => {
        originalValues.push(cell.textContent);
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'edit-input';
        input.value = cell.textContent;
        cell.textContent = '';
        cell.appendChild(input);
    });
    
    // アクションボタンを変更
    const actionCell = row.querySelector('.action-cell');
    actionCell.innerHTML = `
        <button class="btn-save" onclick="saveRow(${index})">💾 保存</button>
        <button class="btn-cancel-edit" onclick="cancelEdit(${index}, ${JSON.stringify(originalValues).replace(/"/g, '&quot;')})">✖️ キャンセル</button>
    `;
}

/**
 * 編集を保存
 */
function saveRow(index) {
    const row = document.querySelector(`tr[data-index="${index}"]`);
    const inputs = row.querySelectorAll('.edit-input');
    
    // データを更新
    const updatedData = {};
    inputs.forEach((input, i) => {
        updatedData[currentHeaders[i]] = input.value;
    });
    
    currentData[index] = updatedData;
    displayTable(currentData);
    alert('✅ 図書情報を更新しました！');
}

/**
 * 編集をキャンセル
 */
function cancelEdit(index, originalValues) {
    displayTable(currentData);
}

/**
 * CSVとしてエクスポート
 */
function exportToCSV() {
    const csv = Papa.unparse(currentData);
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
