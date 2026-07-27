import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from "./firebase-init.js";

function toUserInfo(user) {
  return user ? { uid: user.uid, email: user.email } : null;
}

export async function registerUser(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return toUserInfo(cred.user);
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return toUserInfo(cred.user);
}

export async function logoutUser() {
  await signOut(auth);
}

// Waits for Firebase to finish restoring any existing session (runs once on app start).
export function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(toUserInfo(user));
    });
  });
}
