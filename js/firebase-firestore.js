import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { db } from "./firebase-init.js";

function withId(docSnap) {
  return { id: docSnap.id, ...docSnap.data() };
}

export async function getAll(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map(withId);
}

export async function getById(collectionName, id) {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? withId(snap) : null;
}

export async function getWhere(collectionName, field, value) {
  const q = query(collection(db, collectionName), where(field, "==", value));
  const snap = await getDocs(q);
  return snap.docs.map(withId);
}

export async function addItem(collectionName, data) {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}

export async function setItem(collectionName, id, data) {
  await setDoc(doc(db, collectionName, id), data, { merge: true });
}

export async function deleteItem(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}
