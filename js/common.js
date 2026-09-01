// 共用常數與網站共用小工具（導覽列、字級切換）

// 網站品牌名稱：唯一一處寫死的地方，導覽列、每個頁面的分頁標題都從這裡取用。
// 之後如果要改名（例如從單一縣市擴大成全台灣），只要改這一行，不用進每個頁面的 <title> 改。
// 純文字，不是密鑰／敏感資料，repo 是 public 也沒關係，本來就是要讓所有訪客看到的公開品牌名稱。
const SITE_NAME = "澎湖縣滾動三力學運動地圖資訊平台";

const TOWNSHIPS = [
  { id: "magong", name: "馬公市" },
  { id: "huxi", name: "湖西鄉" },
  { id: "baisha", name: "白沙鄉" },
  { id: "xiyu", name: "西嶼鄉" },
  { id: "wangan", name: "望安鄉" },
  { id: "qimei", name: "七美鄉" },
];

// 運動項目原本是寫死在這裡的常數，現在改成後台可管理，實際資料存在 Firestore 的 sportTypes 集合。
// 這份只留著當「第一次初始化」用的預設值（admin-sporttypes.html 在集合是空的時候會用這份資料建檔）。
// 客戶正式資料確認「滾動三力學」全部都是地板滾球，原本的太極拳／土風舞…8 種只是展示用的假資料，
// 已經從 Firestore 移除，這裡也同步改成只留正式的這一項，避免之後重新播種又長回展示資料。
const DEFAULT_SPORT_TYPES = [
  {
    id: "floorcurling",
    name: "地板滾球",
    icon: "/images/icons/floorcurling.svg",
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

// 客戶回饋課程分兩種（滾動三力學課程據點／地板滾球活動據點），日後可能還會再加其他活動類型，
// 所以比照運動項目的做法做成後台可管理（實際資料存在 Firestore 的 activityTypes 集合），
// 不是像 VENUE_TYPES／COURSE_STATUS 那樣寫死固定幾種。
const DEFAULT_ACTIVITY_TYPES = [
  { id: "course", name: "滾動三力學課程據點", color: "#14919b", active: true },
  { id: "activity", name: "地板滾球活動據點", color: "#e76f51", active: true },
];

let ACTIVITY_TYPES = [];

async function loadActivityTypes() {
  ACTIVITY_TYPES = await getAll("activityTypes");
}

function activeActivityTypes(keepIds = []) {
  return ACTIVITY_TYPES.filter(
    (a) => a.active !== false || keepIds.includes(a.id),
  );
}

// 活動類型名稱是後台可編輯的 Firestore 資料，直接在這裡轉義（理由跟 sportName() 一樣：
// 這樣不管哪個頁面呼叫都不會漏，避免後台帳號被盜用時能透過類型名稱對一般訪客執行 XSS）
function activityTypeName(id) {
  return escapeHtml(ACTIVITY_TYPES.find((a) => a.id === id)?.name || id);
}

// 後台可以幫每個活動類型選顏色（見 admin-activitytypes.html），標籤用這個顏色跟其他類型區分開來；
// 沒設顏色的舊資料 fallback 回原本的深藍色，不會變成沒顏色
function activityTypeColor(id) {
  return escapeHtml(ACTIVITY_TYPES.find((a) => a.id === id)?.color || "#0a5c78");
}

const VENUE_TYPES = [
  { id: "community_center", name: "社區活動中心" },
  { id: "association", name: "社區協會" },
  { id: "health_center", name: "衛生所" },
];

// 上課時段（滾動三力學運動地圖規格的搜尋篩選要用），課程的上課時間本身是自由填寫的文字（例如「每週三14:00-16:00」），
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

// Google 雲端硬碟的「共用連結」（.../file/d/檔案ID/view?usp=sharing）不能直接當圖片網址用，
// 瀏覽器會顯示雲端硬碟的網頁本身而不是圖片本身；後台填「圖片網址」貼這種連結是常見狀況，
// 存檔前自動偵測、轉成可以直接讀取圖片的格式，不用每次都手動換算檔案 ID。
// 不過 Google 那個直連網址本身不保證穩定（沒有公開文件、偶爾會擋掉或改行為），只當作
// 退路用；真的要穩定顯示還是建議用 fileToCompressedDataUrl() 把圖片直接存進 Firestore。
function normalizeImageUrl(url) {
  const trimmed = (url || "").trim();
  const m =
    trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/uc?export=view&id=${m[1]}` : trimmed;
}

// 免費方案沒有 Firebase Storage，圖片改壓縮後直接存進 Firestore 文件（單一文件上限 1MB，
// 所以先縮到最長邊 1280px、JPEG 品質視大小遞減壓縮，一般照片壓完遠低於上限）。
// 場域照片、公告圖片、成果集照片共用這份，不用每個後台頁面各寫一份一樣的壓縮邏輯。
async function fileToCompressedDataUrl(file, maxDim = 1280, maxBytes = 700000) {
  const rawDataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("讀取檔案失敗"));
    reader.readAsDataURL(file);
  });

  // 瀏覽器不一定能解碼所有圖片格式（最常見的是 iPhone 預設的 HEIC/HEIC），
  // 失敗時原本的 onerror 事件物件訊息看不出原因，這裡換成明確的錯誤說明
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("瀏覽器無法讀取這張圖片，可能是 HEIC 等不支援的格式，請先轉存成 JPG 或 PNG"));
    el.src = rawDataUrl;
  });

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = 0.85;
  let out = canvas.toDataURL("image/jpeg", quality);
  while (out.length > maxBytes * 1.4 && quality > 0.35) {
    quality -= 0.15;
    out = canvas.toDataURL("image/jpeg", quality);
  }
  return out;
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

// 運動項目名稱是後台可編輯的 Firestore 資料，這裡直接做轉義（而不是要求每個呼叫端各自包 escapeHtml），
// 這樣不管哪個頁面呼叫都不會漏，避免後台帳號被盜用時，有心人士能透過項目名稱對一般訪客執行 XSS
function sportName(id) {
  return escapeHtml(SPORT_TYPES.find((s) => s.id === id)?.name || id);
}

// 既有 Firestore 資料可能是改成資料夾結構前存的相對路徑（例如 "images/icons/taichi.svg"），
// 頁面現在都搬進子資料夾了，相對路徑會解析錯地方，這裡統一補成根路徑；外部網址／已經是根路徑的不動。
// 圖示網址同樣是後台可編輯欄位，插進 href="..." 屬性前一併轉義，避免被拿來跳脫屬性做 XSS
function sportIcon(id) {
  const icon = SPORT_TYPES.find((s) => s.id === id)?.icon || "";
  const normalized = icon && !icon.startsWith("/") && !icon.startsWith("http") ? "/" + icon : icon;
  return escapeHtml(normalized);
}

// 課程招生狀態，固定 6 種（客戶「滾動三力學運動地圖」規格指定），不像運動項目那樣需要後台新增，所以直接寫死；
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
        ${c.activityType ? `<span class="activity-type-tag" style="--activity-color: ${activityTypeColor(c.activityType)}">${activityTypeName(c.activityType)}</span>` : ""}
        ${status ? `<span class="status-badge" style="--status-color: ${status.color}">${status.icon} ${escapeHtml(status.label)}</span>` : ""}
      </p>
      <p class="course-line">課程時間：${escapeHtml(c.schedule)}｜${escapeHtml(c.description)}</p>
      ${detailRows.map(([label, value]) => `<p class="course-detail-line">${label}：${escapeHtml(value)}</p>`).join("")}
    </div>
  `;
}

// 後台的新增／編輯表單改成彈出視窗呈現，不用捲到清單下方才看得到表單，表單本身很長時視窗內自己捲動就好。
// formHtml 是 null（沒有正在編輯）時只是把視窗關掉；每次呼叫都會先關掉舊的再開新的，不會疊出好幾層視窗。
// 點視窗外面／按 Escape 不會關閉：填表填到一半誤觸背景或滑鼠手震按到 Esc，
// 內容會整個不見要重打，改成只能按表單裡明確的「取消」或「儲存」按鈕離開
function renderEditModal(formHtml) {
  document.getElementById("edit-modal-overlay")?.remove();
  if (!formHtml) return;

  const overlay = document.createElement("div");
  overlay.className = "confirm-overlay";
  overlay.id = "edit-modal-overlay";
  overlay.innerHTML = `<div class="edit-modal-dialog" role="dialog" aria-modal="true">${formHtml}</div>`;
  document.body.appendChild(overlay);
}

function venueTypeName(id) {
  return VENUE_TYPES.find((v) => v.id === id)?.name || id;
}

// ---- 頁籤 ----

// 按鈕 data-tab 對應面板 data-tab-panel，切換時只顯示同一個值的那個面板
// （見 results-contact.html、about-evaluation.html：一頁放兩個網頁內容時用）
function initTabs() {
  const tabs = document.querySelectorAll("[data-tab]");
  const panels = document.querySelectorAll("[data-tab-panel]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      panels.forEach((p) => { p.hidden = p.dataset.tabPanel !== tab.dataset.tab; });
    });
  });
}

// ---- 導覽列 ----

// 頁籤文字＋順序照客戶「網頁建置.xlsx」的「上方標題」工作表。
// H、I 兩欄客戶確認是「兩個標題合成一個頁籤」：成果與資源／聯絡我們共用一頁，關於我們／方案評估平台共用一頁，
// 頁籤文字把兩個標題都放出來，實際頁面裡用 initTabs() 切成兩個分頁顯示（見 results-contact.html、about-evaluation.html）。
// 社區活動查詢／活動資訊這幾頁客戶的新規劃裡沒有列在頁籤上，頁面本身還在，只是先不放進導覽列。
// 常見問題原本也是這種「先不放導覽列」的頁面，後來客戶確認前台不需要，已經整頁刪除（連同後台的常見問題管理）。
const NAV_LINKS = [
  { href: "/home-map/", label: "首頁" },
  { href: "/posts/?category=news", label: "最新消息" },
  { href: "/about-program/", label: "認識滾動三力學" },
  { href: "/course-benefits/", label: "課程效益" },
  { href: "/sports-map/", label: "滾動三力學運動地圖" },
  { href: "/join-course/", label: "參與課程" },
  { href: "/join-team/", label: "加入指導團隊" },
  { href: "/results-contact/", label: "成果與資源／聯絡我們" },
  { href: "/about-evaluation/", label: "關於我們／方案評估平台" },
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

// 後台維護、登出（或未登入時的管理者登入）不放進選單裡，是隨時都看得到的獨立按鈕，
// 分別放在「返回首頁」右邊、選單右邊——admin-link 放不放看角色，auth-link 兩種狀態一定會有一個
function adminLinkHtml(role) {
  return role === "admin" ? `<a href="/admin/" class="nav-admin-link">後台維護</a>` : "";
}

function authLinkHtml(role) {
  if (role === "admin") {
    return `<a href="#" id="nav-logout" class="nav-auth-btn nav-logout-link">登出</a>`;
  }
  return `<a href="/login/" class="nav-auth-btn">管理者登入</a>`;
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
      location.href = "/home-map/";
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

// 後台儲存成功後的提醒：畫面右下角跳出小提示、自動消失，不用像 showConfirmDialog 那樣等使用者按按鈕，
// 儲存本來就是常常連續做的動作（改完一筆接著改下一筆），跳出還要點掉的視窗反而擋路
function showToast(message) {
  document.getElementById("toast")?.remove();
  const el = document.createElement("div");
  el.id = "toast";
  el.className = "toast";
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}

// 頁籤收合成一個按鈕：有滑鼠的裝置用 CSS :hover 自動展開/收合（見 style.css），
// 觸控裝置沒有 hover，改成點按鈕切換開關、點選單以外的地方自動收合
function wireNavToggle() {
  const btn = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  if (!btn || !links) return;
  if (window.matchMedia("(hover: hover)").matches) return;

  btn.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (links.classList.contains("open") && !e.target.closest(".nav-bar")) {
      links.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
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
      <a class="nav-brand" href="/"><img src="/images/logo-banner.jpg" alt="" class="nav-logo" />${SITE_NAME}</a>
      <a class="nav-home" href="/home-map/">🏠 返回首頁</a>
      <div class="nav-menu">
        <button type="button" class="nav-toggle" id="nav-toggle" aria-label="開啟選單" aria-expanded="false">☰ 選單</button>
        <div class="nav-links" id="nav-links">${links}</div>
      </div>
      <span id="nav-admin-slot"></span>
      <span id="nav-auth-slot"></span>
    </div>
  `;
  wireNavToggle();

  const adminEl = document.getElementById("nav-admin-slot");
  const authEl = document.getElementById("nav-auth-slot");

  function applyAuthUi(role) {
    adminEl.innerHTML = adminLinkHtml(role);
    authEl.innerHTML = authLinkHtml(role);
    if (role === "admin") wireLogoutButton();
  }

  const cached = getCachedAuth();
  applyAuthUi(cached ? cached.role : null);

  onAuthReady(async (user) => {
    if (!user) {
      setCachedAuth(null);
      applyAuthUi(null);
      return;
    }
    const profile = await getById("users", user.uid);
    const role = profile && profile.role === "admin" ? "admin" : "user";
    setCachedAuth({ uid: user.uid, role });
    applyAuthUi(role);
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

// 回到頂端按鈕：全站共用，捲動超過一小段才浮現，避免一開頁面就擋住內容
function renderBackToTop() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "back-to-top";
  btn.setAttribute("aria-label", "回到頁面頂端");
  btn.innerHTML = "&uarr;";
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  document.body.appendChild(btn);

  window.addEventListener("scroll", () => {
    btn.classList.toggle("visible", window.scrollY > 300);
  });
}

// 每個頁面的 <title> 現在只寫頁面自己的名稱（例如「首頁」），共用的網站名稱後綴在這裡統一補上，
// 不用在 29 個頁面的 <title> 裡各寫一次完整站名。用 includes() 判斷是避免補兩次：
// 首頁（index.html）本來就是把站名放在標題最前面（SEO 用），不需要再補一次後綴。
function applyTitleSuffix() {
  if (!document.title.includes(SITE_NAME)) {
    document.title = `${document.title} - ${SITE_NAME}`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  applyFontSize();
  applyTitleSuffix();
  renderNav();
  renderBackToTop();
});
