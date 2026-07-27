// 共用常數與網站共用小工具（導覽列、字級切換）

const TOWNSHIPS = [
  { id: "magong", name: "馬公市" },
  { id: "huxi", name: "湖西鄉" },
  { id: "baisha", name: "白沙鄉" },
  { id: "xiyu", name: "西嶼鄉" },
  { id: "wangan", name: "望安鄉" },
  { id: "qimei", name: "七美鄉" },
];

const SPORT_TYPES = [
  { id: "taichi", name: "太極拳", icon: "taichi.svg" },
  { id: "folkdance", name: "土風舞", icon: "folkdance.svg" },
  { id: "croquet", name: "槌球", icon: "croquet.svg" },
  { id: "tabletennis", name: "桌球", icon: "tabletennis.svg" },
  { id: "badminton", name: "羽球", icon: "badminton.svg" },
  { id: "aerobics", name: "有氧運動", icon: "aerobics.svg" },
  { id: "yoga", name: "瑜珈", icon: "yoga.svg" },
  { id: "walking", name: "健走", icon: "walking.svg" },
];

const VENUE_TYPES = [
  { id: "community_center", name: "社區活動中心" },
  { id: "association", name: "社區協會" },
  { id: "health_center", name: "衛生所" },
];

// 把 Firestore 裡的文字（據點名稱、公告內容等）安全地插進 innerHTML 或 HTML 屬性，避免 XSS
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function townshipName(id) {
  return TOWNSHIPS.find((t) => t.id === id)?.name || id;
}

function sportName(id) {
  return SPORT_TYPES.find((s) => s.id === id)?.name || id;
}

function sportIcon(id) {
  return SPORT_TYPES.find((s) => s.id === id)?.icon || "";
}

function venueTypeName(id) {
  return VENUE_TYPES.find((v) => v.id === id)?.name || id;
}

// ---- 導覽列 ----

const NAV_LINKS = [
  { href: "index.html", label: "首頁" },
  { href: "posts.html?category=news", label: "最新消息" },
  { href: "posts.html?category=event", label: "活動資訊" },
  { href: "search.html", label: "社區活動查詢" },
  { href: "faq.html", label: "常見問題" },
  { href: "contact.html", label: "聯絡我們" },
];

function renderNav() {
  const el = document.getElementById("nav");
  if (!el) return;

  const links = NAV_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join("");
  el.innerHTML = `
    <div class="nav-bar">
      <a class="nav-brand" href="index.html">澎湖縣社區運動資源查詢</a>
      <div class="nav-links">${links}<span id="nav-auth-links"></span></div>
    </div>
  `;

  onAuthReady(async (user) => {
    const authEl = document.getElementById("nav-auth-links");
    if (!authEl) return;
    if (!user) {
      authEl.innerHTML = `<a href="login.html" class="nav-cta">會員登入 / 註冊</a>`;
      return;
    }
    const profile = await getById("users", user.uid);
    let html = `<a href="profile.html">會員資料</a><a href="favorites.html">我的最愛</a>`;
    if (profile && profile.role === "admin") {
      html += `<a href="admin.html">後台維護</a>`;
    }
    html += `<a href="#" id="nav-logout">登出</a>`;
    authEl.innerHTML = html;
    document.getElementById("nav-logout").addEventListener("click", async (e) => {
      e.preventDefault();
      await logoutUser();
      location.href = "index.html";
    });
  });
}

// ---- 字級切換（存在 localStorage，跨頁記住選擇） ----

function applyFontSize() {
  const size = localStorage.getItem("fontSize") || "";
  // 用 classList 增減，不要整個覆寫 className，避免把 photo-bg-page 這類其他 class 洗掉
  document.body.classList.remove("text-large", "text-xlarge");
  if (size) document.body.classList.add(size);
}

function setFontSize(size) {
  localStorage.setItem("fontSize", size);
  applyFontSize();
}

// 把某個鄉鎮的代表景觀照設成頁面背景（露在內容卡片周圍），並附上不明顯的小小出處標示
function setBackgroundPhoto(townshipId) {
  const h = TOWNSHIP_HIGHLIGHTS[townshipId];
  if (!h) return;

  document.body.classList.add("photo-bg-page");
  document.body.style.setProperty("--bg-photo", `url('${h.image}')`);

  const credit = document.createElement("div");
  credit.className = "bg-credit";
  credit.innerHTML = `照片來源：<a href="${escapeHtml(h.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(h.credit)}</a>`;
  document.body.appendChild(credit);
}

document.addEventListener("DOMContentLoaded", () => {
  applyFontSize();
  renderNav();
});
