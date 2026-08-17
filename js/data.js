// 通用 Firestore CRUD（所有集合共用同一組函式，不用每個集合各寫一份）

// 這些集合資料量小、只有後台會改，快取在瀏覽器本機（localStorage），訪客不用每次都重新讀一次整個
// 集合。gallery 刻意不放進來：裡面存的是 Base64 照片，量大又持續長大，不適合、也不該整份存進每個
// 訪客自己的裝置裡（改用分頁/延遲載入處理，見 results-contact.html、gallery.html）。
const CACHEABLE_COLLECTIONS = ["venues", "courses", "posts", "faq", "associations", "sportTypes", "activityTypes", "albums"];

// 快取新舊用一個「全站共用版本號」判斷，不是每個集合各自一個版本——這些集合都不大，一起失效重抓
// 的成本很低，換來邏輯簡單很多。任何一個可快取集合被後台寫入時都會自動把版本號往前推進（見下面
// addItem/setItem/deleteItem），訪客下次讀取版本號對不上就重新抓，不用擔心忘記手動清快取而看到
// 舊資料；admin/index.html 另外提供一個手動按鈕，給想立刻讓所有訪客重抓的情境用。
async function getCacheVersion() {
  const doc = await db.collection("meta").doc("cacheVersion").get();
  return doc.exists ? doc.data().v : 0;
}

async function bumpCacheVersion() {
  await db.collection("meta").doc("cacheVersion").set({ v: Date.now() });
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
    localStorage.setItem(dataKey, JSON.stringify(data));
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
