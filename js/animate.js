/* ============================================================
   animate.js — 動畫強化版的共用動態引擎（只有前台頁面載入）
   原則：只加 class 與裝飾用元素，不更動任何頁面文字。
   ============================================================ */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("anim");

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var motionOn = localStorage.getItem("motion") !== "off" && !prefersReduced;

  function applyMotion() {
    root.dataset.motion = motionOn ? "on" : "off";
    var label = document.getElementById("motion-label");
    var btn = document.getElementById("motion-toggle");
    var text = motionOn ? "動畫全開" : "減少動態";
    if (label) label.textContent = text;
    if (btn) {
      btn.setAttribute("aria-pressed", String(motionOn));
      // 手機版只剩圖示，靠 aria-label 讓讀螢幕軟體仍讀得到用途
      btn.setAttribute("aria-label", text);
    }
  }

  /* ---------- 注入裝飾用元素（不含任何網站內容文字） ---------- */
  function injectChrome() {
    var holder = document.createElement("div");
    holder.innerHTML =
      '<div id="scroll-progress"></div>' +
      '<div id="cursor-glow"></div>' +
      '<div id="page-curtain"></div>' +
      '<button type="button" id="motion-toggle" aria-pressed="true">' +
        '<i aria-hidden="true"></i><span id="motion-label"></span>' +
      '</button>';
    while (holder.firstChild) document.body.appendChild(holder.firstChild);

    document.getElementById("motion-toggle").addEventListener("click", function () {
      motionOn = !motionOn;
      localStorage.setItem("motion", motionOn ? "on" : "off");
      applyMotion();
    });
    applyMotion();
  }

  /* ============================================================
     進場動畫
     各頁列表是等 Firestore 回來才畫出來的，所以除了初次掃描，
     還要用 MutationObserver 盯著新加進來的節點補上 .reveal
     ============================================================ */
  var REVEAL_TARGETS = [
    "main > h2", "main > p", "main > ul", "main > ol", "main > table",
    "main > section",
    ".directory-card", ".venue-card", ".post-card", ".township-button",
    ".gallery-thumb", ".evalDemo-card", ".ladder-step",
    ".benefit-detail-list > div", ".course-card"
  ].join(",");

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in");
      io.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

  /* 同一個父層底下的元素依序錯開，最多錯到第 8 個，免得最後幾張等太久 */
  function scan(scope) {
    var seen = [];
    var counts = [];
    var nodes = (scope || document).querySelectorAll(REVEAL_TARGETS);

    Array.prototype.forEach.call(nodes, function (el) {
      if (el.dataset.rev) return;
      if (el.closest("#nav") || el.closest(".hero-section")) return;

      var idx = seen.indexOf(el.parentNode);
      if (idx < 0) { seen.push(el.parentNode); counts.push(0); idx = seen.length - 1; }

      el.dataset.rev = "1";
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(counts[idx]++, 8) * 0.055 + "s";
      io.observe(el);
    });
  }

  /* 保險絲：觀察器若沒觸發，3 秒後強制顯示，內容不會永久空白 */
  function failsafe() {
    setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) {
        el.classList.add("in");
      });
    }, 3000);
  }

  /* ============================================================
     捲動：進度條 + 導覽列吸頂
     ============================================================ */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var max = root.scrollHeight - window.innerHeight;
      var bar = document.getElementById("scroll-progress");
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? root.scrollTop / max : 0) + ")";
      document.body.classList.toggle("nav-stuck", root.scrollTop > 60);
    });
  }

  /* ============================================================
     指標：游標光暈 + 卡片內光暈
     ============================================================ */
  function initPointer() {
    var glow = document.getElementById("cursor-glow");
    var gx = window.innerWidth / 2, gy = window.innerHeight / 2, tx = gx, ty = gy;

    var HOT = "a, button, select, input, textarea, [role=button], .map-marker-hit, .township-hit-area";

    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      document.body.classList.add("pointer-live");
      tx = e.clientX; ty = e.clientY;

      if (!e.target.closest) return;

      // 移到可點的東西上就放大光環，讓「這裡可以按」更清楚
      document.body.classList.toggle("cursor-hot", !!e.target.closest(HOT));

      var card = e.target.closest(".directory-card, .venue-card, .post-card");
      if (card) {
        var b = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - b.left) + "px");
        card.style.setProperty("--my", (e.clientY - b.top) + "px");
      }
    }, { passive: true });

    // 滑鼠離開視窗就收起來，免得光環停在最後一個位置上
    document.addEventListener("mouseleave", function () {
      document.body.classList.remove("pointer-live");
    });
    document.addEventListener("mouseenter", function () {
      document.body.classList.add("pointer-live");
    });

    /* 貼緊游標：0.34 的跟隨係數還留一點拖曳感，但不會讓人找不到自己在哪 */
    (function lerp() {
      gx += (tx - gx) * 0.34;
      gy += (ty - gy) * 0.34;
      if (motionOn && glow) glow.style.transform = "translate3d(" + gx + "px," + gy + "px,0)";
      requestAnimationFrame(lerp);
    })();
  }

  /* ============================================================
     換頁轉場：站內連結先放簾幕再跳頁
     ============================================================ */
  function initPageTransition() {
    var curtain = document.getElementById("page-curtain");

    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || !motionOn) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      var a = e.target.closest && e.target.closest("a[href]");
      if (!a) return;

      var href = a.getAttribute("href");
      if (!href || href.charAt(0) === "#" || a.target === "_blank") return;
      if (a.origin && a.origin !== location.origin) return;
      if (href.indexOf("mailto:") === 0 || href.indexOf("tel:") === 0) return;

      e.preventDefault();
      curtain.classList.add("in");
      setTimeout(function () { location.href = a.href; }, 380);
    });

    /* 上一頁放下簾幕後跳過來，新頁面載入時把簾幕收上去 */
    requestAnimationFrame(function () {
      curtain.classList.add("out");
      setTimeout(function () { curtain.classList.remove("out"); }, 500);
    });

    /* 用上一頁／下一頁回來時（bfcache）簾幕要復原 */
    window.addEventListener("pageshow", function () {
      curtain.classList.remove("in");
    });
  }

  /* ============================================================
     開場頁專屬處理（index.html）
     ============================================================ */
  function initHero() {
    var section = document.querySelector(".hero-section");
    if (!section) return;

    var aurora = document.createElement("div");
    aurora.className = "hero-aurora";
    aurora.setAttribute("aria-hidden", "true");
    aurora.innerHTML = "<i></i><i></i><i></i>";
    section.insertBefore(aurora, section.firstChild);

    var cue = document.createElement("div");
    cue.className = "hero-cue";
    cue.setAttribute("aria-hidden", "true");
    section.appendChild(cue);

    /* logo 光圈：一個容器對齊 logo，裡面各層用 inset 自己往外長，
       所以只要算一次位置，不必逐層定位 */
    var logo = section.querySelector(".hero-logo");
    if (logo) {
      var halo = document.createElement("div");
      halo.className = "hero-halo";
      halo.setAttribute("aria-hidden", "true");
      halo.innerHTML =
        '<span class="aura"></span>' +
        '<span class="ring soft"></span>' +
        '<span class="ring"></span>' +
        '<span class="pulse"></span>' +
        '<span class="pulse"></span>' +
        '<span class="pulse"></span>';
      logo.parentNode.insertBefore(halo, logo);

      /* 用 offsetWidth/offsetLeft 而不是 getBoundingClientRect()：
         logo 進場動畫是從 scale(.74) 開始，getBoundingClientRect() 會回報
         被 transform 縮過的尺寸，光圈就會小一圈又位移。offset* 不受 transform 影響。 */
      var placeHalo = function () {
        halo.style.width = logo.offsetWidth + "px";
        halo.style.height = logo.offsetHeight + "px";
        halo.style.left = logo.offsetLeft + "px";
        halo.style.top = logo.offsetTop + "px";
      };
      placeHalo();
      window.addEventListener("resize", placeHalo);
      if (!logo.complete) logo.addEventListener("load", placeHalo);
      // 字體載入會讓上方標題高度變動，logo 位置跟著移，載完再對一次
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(placeHalo);
    }

    /* 主標逐字揭開：只把既有文字拆成字元，文字內容完全不變。
       拆完在 h1 掛 aria-label 保留原文，讀螢幕軟體不會一個字一個字念。 */
    var h1 = section.querySelector("h1");
    if (h1 && motionOn) {
      var text = h1.textContent;
      h1.setAttribute("aria-label", text);
      var frag = document.createDocumentFragment();
      Array.prototype.forEach.call(text, function (ch, i) {
        var s = document.createElement("span");
        s.className = "ch";
        s.setAttribute("aria-hidden", "true");
        s.textContent = ch;
        s.style.animationDelay = (0.3 + i * 0.03) + "s";
        frag.appendChild(s);
      });
      h1.textContent = "";
      h1.appendChild(frag);
    }
  }

  /* ============================================================
     啟動
     ============================================================ */
  function start() {
    injectChrome();
    initHero();
    scan();
    failsafe();
    initPointer();
    initPageTransition();
    onScroll();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    /* 頁面內容是等資料回來才畫出來的，盯著 main 補標記
       （只看子節點增減，加 class 不會自我觸發） */
    var main = document.querySelector("main");
    if (main) {
      var timer;
      new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () { scan(main); onScroll(); }, 60);
      }).observe(main, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
