// 共用的「我的最愛」星號按鈕，套用到頁面上所有 <span class="fav-slot" data-venue="xxx" data-sport="yyy"> 元素。
// 收藏記錄的是「據點＋當下正在看的運動」這個組合（data-sport 沒帶就代表沒有特定運動、收藏整個據點），
// 這樣使用者在某個運動的篩選畫面收藏時，我的最愛才會記得是為了哪項運動收藏的，而不是只記住據點本身。

function isSameFavorite(a, venueId, sportType) {
  return a.venueId === venueId && (a.sportType || null) === (sportType || null);
}

async function renderFavoriteToggles() {
  const slots = document.querySelectorAll(".fav-slot[data-venue]");
  if (!slots.length) return;

  onAuthReady(async (user) => {
    let profile = null;
    if (user) profile = await getById("users", user.uid);

    slots.forEach((slot) => {
      const venueId = slot.dataset.venue;
      const sportType = slot.dataset.sport || null;
      const isFav = profile && (profile.favorites || []).some((f) => isSameFavorite(f, venueId, sportType));
      const sportArg = sportType ? `'${sportType}'` : "null";
      slot.innerHTML = `<button type="button" class="favorite-toggle" title="加入我的最愛" onclick="toggleFavorite('${venueId}', ${sportArg}, this)">${isFav ? "★" : "☆"}</button>`;
    });
  });
}

function toggleFavorite(venueId, sportType, btn) {
  onAuthReady(async (user) => {
    if (!user) {
      location.href = "login.html";
      return;
    }
    const profile = (await getById("users", user.uid)) || { favorites: [], favoriteSports: [] };
    profile.favorites = profile.favorites || [];
    const idx = profile.favorites.findIndex((f) => isSameFavorite(f, venueId, sportType));
    if (idx >= 0) {
      profile.favorites.splice(idx, 1);
    } else {
      profile.favorites.push({ venueId, sportType });
    }
    await setItem("users", user.uid, profile);
    btn.textContent = idx >= 0 ? "☆" : "★";
  });
}
