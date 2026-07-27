// 共用的「我的最愛」星號按鈕，套用到頁面上所有 <span class="fav-slot" data-venue="xxx"> 元素

async function renderFavoriteToggles() {
  const slots = document.querySelectorAll(".fav-slot[data-venue]");
  if (!slots.length) return;

  onAuthReady(async (user) => {
    let profile = null;
    if (user) profile = await getById("users", user.uid);

    slots.forEach((slot) => {
      const venueId = slot.dataset.venue;
      const isFav = profile && (profile.favoriteVenueIds || []).includes(venueId);
      slot.innerHTML = `<button type="button" class="favorite-toggle" title="加入我的最愛" onclick="toggleFavorite('${venueId}', this)">${isFav ? "★" : "☆"}</button>`;
    });
  });
}

function toggleFavorite(venueId, btn) {
  onAuthReady(async (user) => {
    if (!user) {
      location.href = "login.html";
      return;
    }
    const profile = (await getById("users", user.uid)) || { favoriteVenueIds: [], favoriteSports: [] };
    profile.favoriteVenueIds = profile.favoriteVenueIds || [];
    const idx = profile.favoriteVenueIds.indexOf(venueId);
    if (idx >= 0) {
      profile.favoriteVenueIds.splice(idx, 1);
    } else {
      profile.favoriteVenueIds.push(venueId);
    }
    await setItem("users", user.uid, profile);
    btn.textContent = idx >= 0 ? "☆" : "★";
  });
}
