// 구글시트 CSV 링크를 여기에 넣어주세요.
// 예: const CSV_URL = "https://docs.google.com/spreadsheets/d/e/.../pub?output=csv";
const CSV_URL = "";

const list = document.getElementById("list");
const searchInput = document.getElementById("searchInput");
let rows = [];

function parseCSV(text){
  const result = [];
  let row = [], cell = "", quote = false;

  for(let i=0; i<text.length; i++){
    const ch = text[i], next = text[i+1];

    if(ch === '"' && quote && next === '"'){
      cell += '"'; i++;
    }else if(ch === '"'){
      quote = !quote;
    }else if(ch === "," && !quote){
      row.push(cell); cell = "";
    }else if((ch === "\n" || ch === "\r") && !quote){
      if(cell || row.length){ row.push(cell); result.push(row); row = []; cell = ""; }
      if(ch === "\r" && next === "\n") i++;
    }else{
      cell += ch;
    }
  }
  if(cell || row.length){ row.push(cell); result.push(row); }
  return result;
}

function render(){
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = rows.filter(r => (r.name || "").toLowerCase().includes(keyword));

  if(!filtered.length){
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

async function load(){
  if(!CSV_URL){
    list.innerHTML = `<div class="empty">script.js의 CSV_URL에 구글시트 CSV 링크를 넣어주세요 ✨</div>`;
    return;
  }

  const res = await fetch(CSV_URL);
  const text = await res.text();
  const data = parseCSV(text);
  const headers = data[0];

  rows = data.slice(1).map(row => {
    const name = row[0];
    const items = headers.slice(1).map((title, i) => ({
      title,
      count: row[i+1]
    })).filter(x =>
      x.title &&
      x.count &&
      x.count !== "0" &&
      !x.title.includes("킬") &&
      x.title !== "닉네임" &&
      x.title !== "상품"
    );

    return { name, items };
  }).filter(r => r.name && r.items.length);

  render();
}

searchInput.addEventListener("input", render);
load();
