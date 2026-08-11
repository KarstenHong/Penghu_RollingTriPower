# 澎湖縣滾動三力學運動地圖資訊平台

澎湖縣社區運動資源查詢網站，讓學員與一般民眾能依鄉鎮尋找社區運動課程據點（活動中心／社區協會／衛生所），查看上課時間、招生狀態與聯絡方式；後台提供縣府／執行團隊自行維護據點、課程、公告、常見問題、活動成果照片與管理者帳號，不需要工程師介入。

**線上網址**：https://rollingtripower.tw/

## 技術架構

純前端多頁式網站，沒有打包建置流程：

- **前端**：Vanilla HTML／CSS／JavaScript（`<script>` 標籤直接引用，無框架、無 npm 建置）
- **後端**：Firebase
  - **Authentication**（Email／Password）：僅供管理者登入後台，網站本身不開放一般民眾註冊會員
  - **Firestore**：所有內容資料（據點、課程、公告等）都存在這裡，前台唯讀公開、後台寫入需要 admin 角色
  - **免費 Spark 方案**，沒有開通 Firebase Storage；後台上傳的照片會先在瀏覽器端壓縮，直接以 Base64 字串存進 Firestore 文件（見下方「已知限制」）
- **託管**：GitHub Pages，`main` 分支推送後自動部署，綁定自訂網域 `rollingtripower.tw`（已強制 HTTPS）
- **網址結構**：每個頁面都是獨立資料夾＋`index.html`（例如 `home-map/index.html` 對應 `/home-map/`），沒有 `.html` 副檔名

## 網站地圖

### 公開頁面
| 頁面 | 路徑 | 說明 |
|---|---|---|
| 進場頁 | `/` | 全螢幕視覺，點「開始」進入首頁 |
| 首頁 | `/home-map/` | 各功能頁的入口卡片、字體大小切換 |
| 認識滾動三力學 | `/about-program/` | 內容製作中 |
| 課程效益 | `/course-benefits/` | 內容製作中 |
| 滾動三力學運動地圖 | `/sports-map/` | 澎湖鄉鎮地圖，點鄉鎮進入該區域詳細地圖 |
| 鄉鎮詳細地圖 | `/township/?id=` | 該鄉鎮所有據點的運動項目圖釘，點圖釘看據點詳情 |
| 據點詳細介紹 | `/venue-detail/?venue=` | 單一據點的完整資訊與課程列表 |
| 參與課程 | `/join-course/` | 課程據點搜尋（關鍵字／鄉鎮／運動項目篩選） |
| 社區活動查詢 | `/search/` | 據點搜尋（獨立頁，篩選邏輯與參與課程類似） |
| 加入指導團隊 | `/join-team/` | 培訓核心能力、方案理念核心、報名門檻、指導員成長分級制度 |
| 最新消息／活動資訊 | `/posts/?category=news` 或 `?category=event` | 公告列表 |
| 公告詳細內容 | `/post-detail/?id=` | 單則公告 |
| 常見問題 | `/faq/` | FAQ 列表 |
| 成果與資源／聯絡我們 | `/results-contact/` | 活動成果照片（依相簿分組）＋各鄉鎮社區協會聯絡方式 |
| 活動成果集 | `/gallery/` | 成果照片獨立頁 |
| 關於我們／方案評估平台 | `/about-evaluation/` | 內容製作中 |
| 管理者登入／忘記密碼 | `/login/`、`/forgot-password/` | Firebase Auth 登入、寄送重設密碼信 |

### 後台管理頁面（需要 admin 角色登入）
從 `/admin/` 進入，包含：

- **場域管理**（`/admin-venues/`）：活動中心／社區協會／衛生所等據點資料、座標、照片網址
- **運動課程管理**（`/admin-courses/`）：每個據點提供的課程，含招生狀態、時段、費用等
- **最新消息／活動資訊管理**（`/admin-posts/`）：公告的新增／編輯／刪除
- **常見問題管理**（`/admin-faq/`）
- **社區協會聯絡資訊管理**（`/admin-associations/`）
- **活動成果集管理**（`/admin-gallery/`）：先建立「相簿」，再上傳照片到相簿裡（可一次選多張），刪除相簿會一併刪除底下照片
- **運動項目管理**（`/admin-sporttypes/`）：新增／下架運動項目（太極拳、土風舞…），供其他頁面的篩選與圖示使用
- **管理者帳號管理**（`/admin-users/`）：新增／刪除管理者帳號

所有刪除操作都會先跳出確認視窗，避免手滑誤刪。

## 後台操作重點

### 上傳成果照片
1. 進入「活動成果集管理」，先「+ 新增相簿」建立一個相簿（例如活動名稱）
2. 點該相簿的「管理照片」，「+ 新增照片」可以一次選多張圖片上傳
3. 照片會在瀏覽器端自動壓縮後存進資料庫，**不支援 iPhone 的 HEIC 格式**，若上傳失敗請先把照片轉存成 JPG／PNG（iPhone「設定 → 相機 → 格式」改成「最相容」即可）

### 新增管理者帳號
1. 進入「管理者帳號管理」，「+ 新增管理者」輸入對方 Email
2. 系統會建立帳號並寄「設定密碼」信到該信箱，對方收信自行設定密碼即可登入，不需要事先幫他想密碼
3. 「刪除」只會移除該帳號的後台權限，**不會刪除 Firebase Authentication 裡的實際登入帳號**；若要讓對方完全無法登入，需另外到 [Firebase 主控台](https://console.firebase.google.com/) 的 Authentication 頁面手動刪除

## Firebase 設定

- **專案**：`penghusportsfinder`
- **設定值**：`js/firebase-config.js`（`apiKey` 等前端設定值本來就設計成公開，實際防護在 Firestore Security Rules，不是靠隱藏這組值）
- **權限模型**：`firestore.rules` 定義，所有內容集合皆「公開唯讀、僅 admin 角色可寫」；`users` 集合另外防止使用者自行把自己升級成 admin
- **⚠️ 規則異動需要手動部署**：修改 `firestore.rules` 後，需要到 Firebase 主控台的 Firestore Database → Rules 貼上最新內容存檔（或用 `firebase deploy --only firestore:rules`），git push **不會**自動同步規則到 Firebase

## 開發與部署

沒有建置流程，改完 `.html`／`.js`／`.css` 檔案即可直接測試：

```bash
git clone https://github.com/KarstenHong/penghu-sports-finder.git
cd penghu-sports-finder
# 用任一種靜態伺服器在本機預覽，例如：
npx serve .
```

部署：推送到 `main` 分支後，GitHub Pages 會自動重新發布，通常 1–2 分鐘內生效，沒有另外的 staging 環境。

## 已知限制

- **免費方案沒有 Firebase Storage**：照片改存 Firestore（Base64），單一文件上限 1MB，已在前端自動壓縮處理，不需要另外注意，但不適合存放大量高解析度原圖
- **管理者刪除不等於停用登入**：見上方「新增管理者帳號」說明
- **Firestore 規則需要手動部署**：見上方「Firebase 設定」說明
