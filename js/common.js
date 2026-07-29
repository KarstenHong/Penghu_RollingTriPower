// 共用常數與網站共用小工具（導覽列、字級切換）

const TOWNSHIPS = [
  { id: "magong", name: "馬公市" },
  { id: "huxi", name: "湖西鄉" },
  { id: "baisha", name: "白沙鄉" },
  { id: "xiyu", name: "西嶼鄉" },
  { id: "wangan", name: "望安鄉" },
  { id: "qimei", name: "七美鄉" },
];

// 運動項目原本是寫死在這裡的常數，現在改成後台可管理，實際資料存在 Firestore 的 sportTypes 集合。
// 這份只留著當「第一次初始化」用的預設值（admin-sporttypes.html 在集合是空的時候會用這份資料建檔），
// id 沿用原本的值，是因為既有的據點／課程資料裡已經存了這些 id 字串（例如 sportType: "taichi"），
// 沿用才能讓舊資料繼續對得上，不用另外寫資料搬遷程式。
const DEFAULT_SPORT_TYPES = [
  { id: "taichi", name: "太極拳", icon: "images/icons/taichi.svg", active: true },
  { id: "folkdance", name: "土風舞", icon: "images/icons/folkdance.svg", active: true },
  { id: "croquet", name: "槌球", icon: "images/icons/croquet.svg", active: true },
  { id: "tabletennis", name: "桌球", icon: "images/icons/tabletennis.svg", active: true },
  { id: "badminton", name: "羽球", icon: "images/icons/badminton.svg", active: true },
  { id: "aerobics", name: "有氧運動", icon: "images/icons/aerobics.svg", active: true },
  { id: "yoga", name: "瑜珈", icon: "images/icons/yoga.svg", active: true },
  { id: "walking", name: "健走", icon: "images/icons/walking.svg", active: true },
];

// 目前已載入的運動項目（含已下架的，下架只是不再讓人「新選」，舊資料的名稱/圖示仍要能查到）。
// 每個頁面要用 SPORT_TYPES、sportName()、sportIcon() 之前，記得先 await loadSportTypes() 一次。
let SPORT_TYPES = [];

async function loadSportTypes() {
  SPORT_TYPES = await getAll("sportTypes");
}

// 給「新增/勾選」用的清單：只列上架中的項目；如果某個項目已下架但目前這筆資料本來就有選，
// 照樣要出現在清單裡（傳 keepIds 進來），不然使用者原本的選擇會在下次儲存時被悄悄清掉
function activeSportTypes(keepIds = []) {
  return SPORT_TYPES.filter((s) => s.active !== false || keepIds.includes(s.id));
}

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

// 驗證台灣身分證字號格式是否正確（開頭英文字母對應戶籍地 + 檢查碼演算法），只用來抓輸入打錯字，不當作密碼或任何驗證用途
function isValidTaiwanId(id) {
  if (!/^[A-Z][12]\d{8}$/.test(id)) return false;
  const letterValues = {
    A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17, I: 34, J: 18,
    K: 19, L: 20, M: 21, N: 22, O: 35, P: 23, Q: 24, R: 25, S: 26, T: 27,
    U: 28, V: 29, W: 32, X: 30, Y: 31, Z: 33,
  };
  const n = String(letterValues[id[0]]);
  const digits = [n[0], n[1], ...id.slice(1).split("")].map(Number);
  const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  return sum % 10 === 0;
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
  { href: "gallery.html", label: "活動成果集" },
  { href: "faq.html", label: "常見問題" },
  { href: "contact.html", label: "聯絡我們" },
];

// 每個網頁都是獨立的頁面（沒有用單頁式框架），每次點連結都會整頁重新載入，
// Firebase 每次都要重新非同步確認登入狀態，這段時間導覽列一開始只能顯示「未登入」，
// 確認完才變成「已登入」，畫面上就會看到頁籤閃一下、跳兩次。
// 用 localStorage 記住上一次確認過的登入狀態，一開始就直接照這個狀態畫，不用等 Firebase 再問一次；
// Firebase 確認完之後才拿真正結果覆蓋回去（萬一跟快取的不一樣，例如在別的分頁登出了）。
function getCachedAuth() {
  try {
    return JSON.parse(localStorage.getItem("authCache"));
  } catch {
    return null;
  }
}

function setCachedAuth(value) {
  if (value) {
    localStorage.setItem("authCache", JSON.stringify(value));
  } else {
    localStorage.removeItem("authCache");
  }
}

function authLinksHtml(role) {
  let html = `<a href="profile.html">會員資料</a><a href="favorites.html">我的最愛</a>`;
  if (role === "admin") {
    html += `<a href="admin.html">後台維護</a>`;
  }
  html += `<a href="#" id="nav-logout" class="nav-logout-link">登出</a>`;
  return html;
}

function wireLogoutButton() {
  document.getElementById("nav-logout")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const confirmed = await showConfirmDialog("確定要登出嗎？", { confirmLabel: "登出", danger: true });
    if (!confirmed) return;
    await logoutUser();
    setCachedAuth(null);
    location.href = "index.html";
  });
}

// 自訂確認視窗，樣式跟網站風格一致（取代原生 confirm()，長輩看的字級/按鈕大小也比較一致）
function showConfirmDialog(message, { confirmLabel = "確定", cancelLabel = "取消", danger = false } = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirm-overlay";
    overlay.innerHTML = `
      <div class="confirm-dialog" role="alertdialog" aria-modal="true">
        <p>${escapeHtml(message)}</p>
        <div class="confirm-buttons">
          <button type="button" class="secondary-button" data-action="cancel">${escapeHtml(cancelLabel)}</button>
          <button type="button" class="${danger ? "danger-button" : "primary-button"}" data-action="confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    function close(result) {
      overlay.remove();
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    }

    function onKeydown(e) {
      if (e.key === "Escape") close(false);
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close(false);
    });
    overlay.querySelector('[data-action="cancel"]').addEventListener("click", () => close(false));
    overlay.querySelector('[data-action="confirm"]').addEventListener("click", () => close(true));
    document.addEventListener("keydown", onKeydown);
  });
}

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

  const authEl = document.getElementById("nav-auth-links");
  const cached = getCachedAuth();
  if (cached) {
    authEl.innerHTML = authLinksHtml(cached.role);
    wireLogoutButton();
  } else {
    authEl.innerHTML = `<a href="login.html" class="nav-cta">會員登入 / 註冊</a>`;
  }

  onAuthReady(async (user) => {
    if (!user) {
      setCachedAuth(null);
      authEl.innerHTML = `<a href="login.html" class="nav-cta">會員登入 / 註冊</a>`;
      return;
    }
    const profile = await getById("users", user.uid);
    const role = profile && profile.role === "admin" ? "admin" : "user";
    setCachedAuth({ uid: user.uid, role });
    authEl.innerHTML = authLinksHtml(role);
    wireLogoutButton();
  });
}

// ---- 字級切換（存在 localStorage，跨頁記住選擇） ----

function applyFontSize() {
  const size = localStorage.getItem("fontSize") || "";
  // 放在 <html> 而不是 <body>：CSS 裡大部分元件用 rem，rem 是相對於根元素（html）的字體大小，
  // 放在 body 上只會放大內文，導覽列、按鈕等 rem 單位的元件都不會跟著變大。
  document.documentElement.classList.remove("text-large", "text-xlarge");
  if (size) document.documentElement.classList.add(size);
}

function setFontSize(size) {
  localStorage.setItem("fontSize", size);
  applyFontSize();
}

document.addEventListener("DOMContentLoaded", () => {
  applyFontSize();
  renderNav();
});
