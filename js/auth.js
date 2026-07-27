// Firebase Authentication 包裝（Email/Password）

async function registerUser(email, password, name, birthDate, nationalId) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await setItem("users", cred.user.uid, {
    name,
    birthDate,
    nationalId,
    role: "user",
    phone: "",
    township: "",
    favoriteSports: [],
    favoriteVenueIds: [],
  });
  return cred.user;
}

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

// 需要登入才能看的頁面（會員資料、我的最愛）：沒登入就導回登入頁
function requireLogin(callback) {
  onAuthReady((user) => {
    if (!user) {
      location.href = "login.html";
      return;
    }
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
      location.href = "index.html";
      return;
    }
    callback(user, profile);
  });
}
