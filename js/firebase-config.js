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
const auth = firebase.auth();
const db = firebase.firestore();
