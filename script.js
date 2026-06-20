const CSV_URL = "https://docs.google.com/spreadsheets/d/1qe8zv_WuCkUYwBI7cskVue2TV13wwnUF7AKXAVF9y8Y/gviz/tq?tqx=out:csv&sheet=%EC%8B%9C%ED%8A%B81";

const list = document.getElementById("list");
const searchInput = document.getElementById("searchInput");
let rows = [];

function parseCSV(text) {
  const result = [];
  let row = [], cell = "", quote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], next = text[i + 1];
    if (ch === '"' && quote && next === '"') { cell += '"'; i++; }
    else if (ch === '"') quote = !quote;
    else if (ch === "," && !quote) { row.push(cell.trim()); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quote) {
      if (cell || row.length) { row.push(cell.trim()); result.push(row); row = []; cell = ""; }
      if (ch === "\r" && next === "\n") i++;
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell.trim()); result.push(row); }
  return result;
}

function render() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = rows.filter(r => r.name.toLowerCase().includes(keyword));

  if (!filtered.length) {
    list.innerHTML = `<div class="empty">검색 결과가 없습니다 🌙</div>`;
    return;
  }

  list.innerHTML = filtered.map(r => `
    <article class="card">
      <h2>🌙 ${r.name}</h2>
      ${r.items.map(item => `
        <div class="item">
          <span>✨ ${item.title}</span>
          <span class="count">${item.count}</span>
        </div>
      `).join("")}
    </article>
  `).join("");
}

async function load() {
  try {
    const res = await fetch(CSV_URL);
    if (!res.ok) throw new Error("CSV 불러오기 실패");
    const text = await res.text();
    const data = parseCSV(text).filter(r => r.some(c => c !== ""));
    const headers = data[0] || [];

    rows = data.slice(1).map(row => {
      const name = row[0] || "";
      const items = headers.slice(1).map((title, i) => {
        return { title: title || "", count: row[i + 1] || "" };
      }).filter(x =>
        x.title &&
        x.count &&
        x.count !== "0" &&
        !x.title.includes("킬") &&
        x.title !== "닉네임" &&
        x.title !== "상품"
      );
      return { name, items };
    }).filter(r => r.name && r.name !== "닉네임" && r.name !== "상품" && r.items.length);

    render();
  } catch (err) {
    list.innerHTML = `<div class="empty">
      스프레드시트 연동에 실패했습니다.<br>
      구글시트 공유 설정을 '링크가 있는 모든 사용자 보기 가능'으로 바꾸거나<br>
      파일 → 공유 → 웹에 게시 → CSV로 게시해주세요.
    </div>`;
    console.error(err);
  }
}

searchInput.addEventListener("input", render);
load();
