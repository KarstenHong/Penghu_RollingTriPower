// Firebase Authentication 包裝（Email/Password）。只有管理者需要登入，公開註冊功能已移除，
// 新的管理者帳號要用 Firebase 主控台建立，再把 Firestore users/{uid} 的 role 設成 "admin"

async function loginUser(email, password) {
  const cred = await auth.signInWithEmailAndPassword(email, password);
  return cred.user;
}

async function logoutUser() {
  await auth.signOut();
}

async function sendPasswordReset(email) {
  await auth.sendPasswordResetEmail(email);
}

// Firebase 還原登入狀態是非同步的，第一次呼叫要等它確定完成才知道有沒有登入
function onAuthReady(callback) {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    unsubscribe();
    callback(user);
  });
}

// 後台頁面：沒登入或不是 admin 角色就擋下來
function requireAdmin(callback) {
  onAuthReady(async (user) => {
    if (!user) {
      location.href = "login.html";
      return;
    }
    const profile = await getById("users", user.uid);
    if (!profile || profile.role !== "admin") {
      alert("您沒有後台管理權限");
      location.href = "home-map.html";
      return;
    }
    callback(user, profile);
  });
}
