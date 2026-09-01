// 通用 Firestore CRUD（所有集合共用同一組函式，不用每個集合各寫一份）

// 這些集合資料量小、只有後台會改，快取在瀏覽器本機（localStorage），訪客不用每次都重新讀一次整個
// 集合。gallery 刻意不放進來：裡面存的是 Base64 照片，量大又持續長大，不適合、也不該整份存進每個
// 訪客自己的裝置裡（改用分頁/延遲載入處理，見 results-contact.html、gallery.html）。
const CACHEABLE_COLLECTIONS = ["venues", "courses", "posts", "associations", "sportTypes", "activityTypes", "albums"];

// 單一集合寫進 localStorage 的大小上限（字元數，約等於 1MB）。瀏覽器整體配額約 5MB，這裡留餘裕
// 給其他集合共用，見 getAll() 裡的說明。
const CACHE_MAX_CHARS = 1_000_000;
const oversizeWarned = new Set();

// 快取新舊用一個「全站共用版本號」判斷，不是每個集合各自一個版本——這些集合都不大，一起失效重抓
// 的成本很低，換來邏輯簡單很多。任何一個可快取集合被後台寫入時都會自動把版本號往前推進（見下面
// addItem/setItem/deleteItem），訪客下次讀取版本號對不上就重新抓，不用擔心忘記手動清快取而看到
// 舊資料；admin/index.html 另外提供一個手動按鈕，給想立刻讓所有訪客重抓的情境用。
async function getCacheVersion() {
  const doc = await db.collection("meta").doc("cacheVersion").get();
  return doc.exists ? doc.data().v : 0;
}

// 版本號用「伺服器端遞增」而不是 Date.now()：後者取的是管理者自己電腦的時鐘，時鐘不準或被往回
// 調（換時區、對時、系統還原）就會讓版本號倒退，訪客手上那份舊快取的版本號反而比較新，之後就再也
// 不會失效了。increment 由 Firestore 端計算，永遠只增不減。
async function bumpCacheVersion() {
  await db.collection("meta").doc("cacheVersion")
    .set({ v: firebase.firestore.FieldValue.increment(1) }, { merge: true });
}

async function getAll(collection) {
  if (!CACHEABLE_COLLECTIONS.includes(collection)) {
    const snap = await db.collection(collection).get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  const version = await getCacheVersion();
  const dataKey = `cache:${collection}`;
  const versionKey = `cache:${collection}:v`;

  if (localStorage.getItem(versionKey) === String(version)) {
    try {
      const cached = JSON.parse(localStorage.getItem(dataKey));
      if (cached) return cached;
    } catch {
      // 快取資料壞掉就當作沒快取，往下重新抓一次
    }
  }

  const snap = await db.collection(collection).get();
  const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  try {
    const serialized = JSON.stringify(data);
    // 後台的照片上傳會把 Base64 圖片直接存進 venues/posts 的文件裡（單張上限 700KB），存個幾張就
    // 會超過 localStorage 約 5MB 的配額。原本只靠下面的 catch 接住，結果是「配額爆掉 → 每次都寫
    // 入失敗 → 快取永遠不生效」，而且完全沒有徵兆。這裡先擋掉明顯過大的集合：不快取它就好，該集合
    // 每次重新讀取仍然正常，只是少了快取加速，而其他集合的快取不受影響。
    if (serialized.length > CACHE_MAX_CHARS) {
      if (!oversizeWarned.has(collection)) {
        oversizeWarned.add(collection);
        console.warn(
          `[cache] 集合「${collection}」約 ${Math.round(serialized.length / 1024)}KB，` +
          `超過 ${Math.round(CACHE_MAX_CHARS / 1024)}KB 上限，這次不寫入快取（功能正常，只是沒有快取加速）。` +
          `通常是因為文件裡直接存了 Base64 圖片。`
        );
      }
      localStorage.removeItem(dataKey);
      localStorage.removeItem(versionKey);
      return data;
    }
    localStorage.setItem(dataKey, serialized);
    localStorage.setItem(versionKey, String(version));
  } catch {
    // 無痕模式或容量滿了會丟例外，不快取就好，不影響這次讀到的資料
  }
  return data;
}

async function getById(collection, id) {
  const doc = await db.collection(collection).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

// 不快取的條件查詢，目前給相簿照片的延遲載入用（見 results-contact.html、gallery.html）：
// 每個相簿的照片只在捲到快看到時才抓那一份，query 本身條件太多種，不適合套用整集合快取那一套
async function getWhere(collection, field, value) {
  const snap = await db.collection(collection).where(field, "==", value).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// 條件查詢再加排序＋張數上限，給相簿輪播牆只抓前幾張代表照片用（見 results-contact.html）。
// 注意：where 等於篩選 + orderBy 不同欄位排序，Firestore 需要一個複合索引才能查，第一次上線
// 遇到 FAILED_PRECONDITION 錯誤時，錯誤訊息裡會附一個建立索引的連結，點一次、等索引建好即可，
// 之後就會一直正常，不用每次部署都重建
async function getWhereOrdered(collection, field, value, orderField, direction, limitCount) {
  const snap = await db.collection(collection)
    .where(field, "==", value)
    .orderBy(orderField, direction)
    .limit(limitCount)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function addItem(collection, data) {
  const ref = await db.collection(collection).add(data);
  if (CACHEABLE_COLLECTIONS.includes(collection)) await bumpCacheVersion();
  return ref.id;
}

async function setItem(collection, id, data) {
  await db.collection(collection).doc(id).set(data, { merge: true });
  if (CACHEABLE_COLLECTIONS.includes(collection)) await bumpCacheVersion();
}

async function deleteItem(collection, id) {
  await db.collection(collection).doc(id).delete();
  if (CACHEABLE_COLLECTIONS.includes(collection)) await bumpCacheVersion();
}
