// 通用 Firestore CRUD（所有集合共用同一組函式，不用每個集合各寫一份）

async function getAll(collection) {
  const snap = await db.collection(collection).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function getById(collection, id) {
  const doc = await db.collection(collection).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

async function getWhere(collection, field, value) {
  const snap = await db.collection(collection).where(field, "==", value).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function addItem(collection, data) {
  const ref = await db.collection(collection).add(data);
  return ref.id;
}

async function setItem(collection, id, data) {
  await db.collection(collection).doc(id).set(data, { merge: true });
}

async function deleteItem(collection, id) {
  await db.collection(collection).doc(id).delete();
}
