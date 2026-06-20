// 구글 스프레드시트 ID
const SHEET_ID = '1qe8zv_WuCkUYwBI7cskVue2TV13wwnUF7AKXAVF9y8Y';
const SHEET_NAME = '시트1';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

const listEl = document.getElementById('list');
const statusEl = document.getElementById('status');
const searchInput = document.getElementById('searchInput');
const reloadBtn = document.getElementById('reloadBtn');

let rows = [];

function parseCSV(text) {
  const result = [];
  let row = [];
  let cell = '';
  let quote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quote && next === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      quote = !quote;
    } else if (ch === ',' && !quote) {
      row.push(cell.trim());
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !quote) {
      if (cell || row.length) {
        row.push(cell.trim());
        result.push(row);
        row = [];
        cell = '';
      }
      if (ch === '\r' && next === '\n') i++;
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell.trim());
    result.push(row);
  }
  return result;
}

function normalizeHeader(value) {
  return String(value || '').replace(/\s+/g, '').trim();
}

function isExcludedHeader(header) {
  const h = normalizeHeader(header);
  return !h || h.includes('킬') || h === '닉네임/상품' || h === '닉네임' || h === '상품';
}

function toNumber(value) {
  const n = Number(String(value || '').replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

function makeData(table) {
  const headers = table[0] || [];
  return table.slice(1).map(row => {
    const name = row[0]?.trim();
    if (!name || name === '닉네임 / 상품') return null;

    const items = headers.map((header, idx) => {
      if (idx === 0 || isExcludedHeader(header)) return null;
      const count = toNumber(row[idx]);
      if (!count) return null;
      return { label: header.trim(), count };
    }).filter(Boolean);

    return { name, items, total: items.reduce((sum, item) => sum + item.count, 0) };
  }).filter(row => row && row.items.length);
}

function render() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = rows.filter(row => row.name.toLowerCase().includes(keyword));

  if (!filtered.length) {
    listEl.innerHTML = '<div class="empty">표시할 업보가 없어요.</div>';
    statusEl.textContent = keyword ? '검색 결과가 없어요.' : '0명 표시 중';
    return;
  }

  statusEl.textContent = `${filtered.length}명 표시 중`;
  listEl.innerHTML = filtered.map(row => `
    <article class="card">
      <div class="name">
        <span>${escapeHTML(row.name)}</span>
        <span class="count">총 ${row.total}</span>
      </div>
      <div class="items">
        ${row.items.map(item => `<span class="item">${escapeHTML(item.label)} <b>${item.count}</b></span>`).join('')}
      </div>
    </article>
  `).join('');
}

function escapeHTML(value) {
  return String(value).replace(/[&<>'"]/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[ch]));
}

async function loadData() {
  statusEl.textContent = '불러오는 중...';
  listEl.innerHTML = '';

  try {
    const res = await fetch(`${CSV_URL}&cache=${Date.now()}`);
    if (!res.ok) throw new Error('시트 불러오기 실패');
    const text = await res.text();
    rows = makeData(parseCSV(text));
    render();
  } catch (error) {
    statusEl.textContent = '스프레드시트를 불러오지 못했어요. 공유 설정 또는 웹 게시를 확인해주세요.';
    listEl.innerHTML = '<div class="empty">구글시트에서 파일 → 공유 → 웹에 게시를 먼저 해주세요.</div>';
  }
}

searchInput.addEventListener('input', render);
reloadBtn.addEventListener('click', loadData);
loadData();
