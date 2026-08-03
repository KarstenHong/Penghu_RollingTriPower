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
  {
    id: "taichi",
    name: "太極拳",
    icon: "images/icons/taichi.svg",
    active: true,
  },
  {
    id: "folkdance",
    name: "土風舞",
    icon: "images/icons/folkdance.svg",
    active: true,
  },
  {
    id: "croquet",
    name: "槌球",
    icon: "images/icons/croquet.svg",
    active: true,
  },
  {
    id: "tabletennis",
    name: "桌球",
    icon: "images/icons/tabletennis.svg",
    active: true,
  },
  {
    id: "badminton",
    name: "羽球",
    icon: "images/icons/badminton.svg",
    active: true,
  },
  {
    id: "aerobics",
    name: "有氧運動",
    icon: "images/icons/aerobics.svg",
    active: true,
  },
  { id: "yoga", name: "瑜珈", icon: "images/icons/yoga.svg", active: true },
  {
    id: "walking",
    name: "健走",
    icon: "images/icons/walking.svg",
    active: true,
  },
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
  return SPORT_TYPES.filter(
    (s) => s.active !== false || keepIds.includes(s.id),
  );
}

const VENUE_TYPES = [
  { id: "community_center", name: "社區活動中心" },
  { id: "association", name: "社區協會" },
  { id: "health_center", name: "衛生所" },
];

// 上課時段（三力運動地圖規格的搜尋篩選要用），課程的上課時間本身是自由填寫的文字（例如「每週三14:00-16:00」），
// 沒辦法直接拿來篩選，所以另外加這個結構化欄位讓後台填課程時額外選一個時段
const TIME_SLOTS = [
  { id: "weekday-morning", name: "平日上午" },
  { id: "weekday-afternoon", name: "平日下午" },
  { id: "weekday-evening", name: "平日晚間" },
  { id: "weekend", name: "假日" },
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
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 34,
    J: 18,
    K: 19,
    L: 20,
    M: 21,
    N: 22,
    O: 35,
    P: 23,
    Q: 24,
    R: 25,
    S: 26,
    T: 27,
    U: 28,
    V: 29,
    W: 32,
    X: 30,
    Y: 31,
    Z: 33,
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

// 課程招生狀態，固定 6 種（客戶「三力運動地圖」規格指定），不像運動項目那樣需要後台新增，所以直接寫死；
// 規格要求不能只靠顏色辨識，所以每個狀態都同時有文字跟圖示（多數用圓點，體驗活動用星形跟其他狀態明顯不同）
const COURSE_STATUS = {
  enrolling: { label: "招生中", color: "#2a9d5f", icon: "●" },
  upcoming: { label: "即將開課", color: "#457b9d", icon: "●" },
  ongoing: { label: "課程進行中", color: "#f4a261", icon: "●" },
  full: { label: "本期額滿", color: "#c0392b", icon: "●" },
  paused: { label: "暫停招生", color: "#6c757d", icon: "●" },
  trial: { label: "單次體驗", color: "#e9c46a", icon: "★" },
};

// 據點卡片裡的課程資訊卡：狀態徽章＋時間說明是基本欄位，其餘（課程期間、對象、指導團隊…）是選填欄位，
// 只有後台實際填了才會顯示那一行，舊資料沒有這些欄位時畫面不會出現一堆空白列
function renderCourseCard(c) {
  const status = COURSE_STATUS[c.status];
  const detailRows = [
    [
      "課程期間",
      c.startDate && c.endDate ? `${c.startDate} 至 ${c.endDate}` : "",
    ],
    ["適合對象", c.targetAudience],
    ["指導團隊", c.instructorTeam],
    ["是否收費", c.fee],
    ["報名方式", c.registrationMethod],
    ["無障礙資訊", c.accessibilityInfo],
    ["其他提醒", c.otherNotes],
  ].filter(([, value]) => value);

  return `
    <div class="course-card">
      <p class="course-line">
        ${status ? `<span class="status-badge" style="--status-color: ${status.color}">${status.icon} ${escapeHtml(status.label)}</span>` : ""}
        課程時間：${escapeHtml(c.schedule)}｜${escapeHtml(c.description)}
      </p>
      ${detailRows.map(([label, value]) => `<p class="course-detail-line">${label}：${escapeHtml(value)}</p>`).join("")}
    </div>
  `;
}

// 後台的新增／編輯表單改成彈出視窗呈現，不用捲到清單下方才看得到表單，表單本身很長時視窗內自己捲動就好。
// formHtml 是 null（沒有正在編輯）時只是把視窗關掉；每次呼叫都會先關掉舊的再開新的，不會疊出好幾層視窗。
function renderEditModal(formHtml, onClose) {
  document.getElementById("edit-modal-overlay")?.remove();
  if (!formHtml) return;

  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.id = "edit-modal-overlay";
  overlay.innerHTML = `<div class="edit-modal-dialog" role="dialog" aria-modal="true">${formHtml}</div>`;
  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) onClose();
  });
  document.addEventListener("keydown", function onKeydown(e) {
    if (e.key === "Escape") {
      document.removeEventListener("keydown", onKeydown);
      onClose();
    }
  });
}

function venueTypeName(id) {
  return VENUE_TYPES.find((v) => v.id === id)?.name || id;
}

// ---- 導覽列 ----

// 頁籤文字＋順序照客戶「網頁建置.xlsx」的「上方標題」工作表。
// H、I 兩欄客戶確認是「兩個標題合成一個頁籤」：成果與資源／聯絡我們共用一頁，關於我們／方案評估平台共用一頁，
// 頁籤文字把兩個標題都放出來，實際頁面裡也是兩個段落都顯示（見 results-contact.html、about-evaluation.html）。
// 常見問題／社區活動查詢／活動資訊這幾頁客戶的新規劃裡沒有列在頁籤上，頁面本身還在，只是先不放進導覽列。
const NAV_LINKS = [
  { href: "index.html", label: "首頁" },
  { href: "posts.html?category=news", label: "最新消息" },
  { href: "about-program.html", label: "認識三力學" },
  { href: "course-benefits.html", label: "課程效益" },
  { href: "sports-map.html", label: "三力運動地圖" },
  { href: "join-course.html", label: "參與課程" },
  { href: "join-team.html", label: "加入指導團隊" },
  { href: "results-contact.html", label: "成果與資源／聯絡我們" },
  { href: "about-evaluation.html", label: "關於我們／方案評估平台" },
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
  let html = "";
  if (role === "admin") {
    html += `<a href="admin.html">後台維護</a>`;
  }
  html += `<a href="#" id="nav-logout" class="nav-logout-link">登出</a>`;
  return html;
}

function wireLogoutButton() {
  document
    .getElementById("nav-logout")
    ?.addEventListener("click", async (e) => {
      e.preventDefault();
      const confirmed = await showConfirmDialog("確定要登出嗎？", {
        confirmLabel: "登出",
        danger: true,
      });
      if (!confirmed) return;
      await logoutUser();
      setCachedAuth(null);
      location.href = "index.html";
    });
}

// 自訂確認視窗，樣式跟網站風格一致（取代原生 confirm()，長輩看的字級/按鈕大小也比較一致）
function showConfirmDialog(
  message,
  { confirmLabel = "確定", cancelLabel = "取消", danger = false } = {},
) {
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
    overlay
      .querySelector('[data-action="cancel"]')
      .addEventListener("click", () => close(false));
    overlay
      .querySelector('[data-action="confirm"]')
      .addEventListener("click", () => close(true));
    document.addEventListener("keydown", onKeydown);
  });
}

function renderNav() {
  const el = document.getElementById("nav");
  if (!el) return;

  const links = NAV_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join(
    "",
  );
  el.innerHTML = `
    <div class="nav-bar">
      <a class="nav-brand" href="index.html">澎湖縣三力運動地圖</a>
      <div class="nav-links">${links}<span id="nav-auth-links"></span></div>
    </div>
  `;

  const authEl = document.getElementById("nav-auth-links");
  const cached = getCachedAuth();
  if (cached) {
    authEl.innerHTML = authLinksHtml(cached.role);
    wireLogoutButton();
  } else {
    authEl.innerHTML = `<a href="login.html">管理者登入</a>`;
  }

  onAuthReady(async (user) => {
    if (!user) {
      setCachedAuth(null);
      authEl.innerHTML = `<a href="login.html">管理者登入</a>`;
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
