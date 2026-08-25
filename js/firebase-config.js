// Firebase 專案設定 + 初始化（Compat SDK，搭配 <script> 標籤直接使用，不需要打包工具）
const firebaseConfig = {
  apiKey: "AIzaSyD_nRu9voYABex_G2_sQpdQIVYpQUc4Sx8",
  authDomain: "penghusportsfinder.firebaseapp.com",
  projectId: "penghusportsfinder",
  storageBucket: "penghusportsfinder.firebasestorage.app",
  messagingSenderId: "945088002548",
  appId: "1:945088002548:web:0956c5d42114b1838461a1",
};

firebase.initializeApp(firebaseConfig);

// App Check：擋掉「複製 firebaseConfig 後自己寫程式大量呼叫 Firestore」的濫用。
// Site key 來自 https://www.google.com/recaptcha/admin （reCAPTCHA v3），並在
// Firebase 主控台 > App Check 註冊過這個 Web App。site key 本來就是要送到瀏覽器端的公開值。
// 這支 script 是在 <head> 同步執行的，這時候 <body> 還不存在，reCAPTCHA loader
// 要塞 script 進 document.body 會拿到 null 而噴錯，所以等 DOM 解析完再啟用。
document.addEventListener("DOMContentLoaded", () => {
  firebase.appCheck().activate(
    new firebase.appCheck.ReCaptchaV3Provider("6Lf8ZJctAAAAAC2RrTGWNIo-hIx04i4q5qGbsnqC"),
    true // 自動更新 token
  );
});

const auth = firebase.auth();
const db = firebase.firestore();
