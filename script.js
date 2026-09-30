// ตัวกรองครู: จังหวัด + วิชา + รูปแบบการเรียน
const prov = document.getElementById("prov");
const search = document.getElementById("search");
const sort = document.getElementById("sort");
const favoritesFilter = document.getElementById("favorites-filter");
const subjects = document.getElementById("subjects");
const grid = document.querySelector(".grid");
const cards = Array.from(document.querySelectorAll(".t"));
const count = document.getElementById("count");
const empty = document.getElementById("empty");
const favoriteStorageKey = "fast-teach-favorites";
let favorites = [];
let favoritesOnly = false;

cards.forEach(function (card, index) {
  card.id = "tutor-" + index;
});

try {
  const saved = JSON.parse(localStorage.getItem(favoriteStorageKey) || "[]");
  if (Array.isArray(saved)) favorites = saved.filter(function (id) {
    return cards.some(function (card) { return card.id === id; });
  });
} catch (error) {
  console.warn("Unable to load saved tutor favorites.", error);
}

function saveFavorites() {
  try {
    localStorage.setItem(favoriteStorageKey, JSON.stringify(favorites));
  } catch (error) {
    console.warn("Unable to save tutor favorites.", error);
  }
}

function toggleFavorite(card, button) {
  const isFavorite = favorites.includes(card.id);
  favorites = isFavorite
    ? favorites.filter(function (id) { return id !== card.id; })
    : favorites.concat(card.id);
  button.setAttribute("aria-pressed", String(!isFavorite));
  button.setAttribute("aria-label", (isFavorite ? "บันทึก" : "นำออกจากรายการโปรด") + " " + card.querySelector("h3").textContent);
  button.innerHTML = isFavorite ? "♡" : "♥";
  saveFavorites();
  applyFilter();
}

cards.forEach(function (card) {
  const button = document.createElement("button");
  const isFavorite = favorites.includes(card.id);
  button.type = "button";
  button.className = "favorite";
  button.setAttribute("aria-pressed", String(isFavorite));
  button.setAttribute("aria-label", (isFavorite ? "นำออกจากรายการโปรด " : "บันทึก ") + card.querySelector("h3").textContent);
  button.innerHTML = isFavorite ? "♥" : "♡";
  button.addEventListener("click", function () { toggleFavorite(card, button); });
  card.querySelector(".cover").appendChild(button);
});

// อ่านค่าจากปุ่มเลือก เช่น id="s-m" -> "m" ("all" = ไม่กรอง)
function picked(name) {
  const el = document.querySelector('input[name="' + name + '"]:checked');
  const key = el ? el.id.split("-")[1] : "all";
  return key === "all" ? "" : key;
}

function applyFilter() {
  const p = prov.value, s = picked("s"), f = picked("f");
  const q = search.value.trim().toLocaleLowerCase();
  const mode = sort.value;
  let n = 0;
  const matching = cards.filter(function (c) {
    const ok =
      (!p || c.dataset.prov === p) &&
      (!s || c.dataset.subs.split(" ").includes(s)) &&
      (!f || c.dataset.modes.split(" ").includes(f)) &&
      (!q || c.textContent.toLocaleLowerCase().includes(q)) &&
      (!favoritesOnly || favorites.includes(c.id));
    c.hidden = !ok;
    if (ok) n++;
    return ok;
  });
  matching.sort(function (a, b) {
    if (mode === "price") return getLowestPrice(a) - getLowestPrice(b);
    if (mode === "rating") return getRating(b) - getRating(a);
    return cards.indexOf(a) - cards.indexOf(b);
  });
  matching.forEach(function (card) { grid.insertBefore(card, empty); });
  empty.classList.toggle("show", n === 0);
  count.textContent = n
    ? (favoritesOnly ? "ครูคนโปรด " + n + " ท่าน" : q ? "พบครู " + n + " ท่านจากคำค้นหา" : p ? "พบครู " + n + " ท่านในจังหวัด" + p : "ครูตัวอย่างทั้งหมด " + n + " ท่าน · เลือกจังหวัดเพื่อกรองในพื้นที่ของคุณ")
    : "";
}

function getLowestPrice(card) {
  const prices = Array.from(card.querySelectorAll(".price")).map(function (el) {
    return Number(el.textContent.replace(/[^\d]/g, ""));
  }).filter(Boolean);
  return prices.length ? Math.min.apply(null, prices) : Number.POSITIVE_INFINITY;
}

function getRating(card) {
  return Number(card.querySelector(".rate").textContent) || 0;
}

prov.addEventListener("change", applyFilter);
search.addEventListener("input", applyFilter);
sort.addEventListener("change", applyFilter);
favoritesFilter.addEventListener("click", function () {
  favoritesOnly = !favoritesOnly;
  favoritesFilter.setAttribute("aria-pressed", String(favoritesOnly));
  favoritesFilter.textContent = favoritesOnly ? "♥ รายการโปรด" : "♡ รายการโปรด";
  applyFilter();
});
document.querySelectorAll('input[name="s"], input[name="f"]').forEach(function (i) {
  i.addEventListener("change", applyFilter);
});
document.querySelectorAll(".scroll-subject").forEach(function (button) {
  button.addEventListener("click", function () {
    subjects.scrollBy({
      left: button.classList.contains("next") ? 180 : -180,
      behavior: "smooth"
    });
  });
});

// ฟอร์มจอง: แสดงหน้าสำเร็จ (ยังไม่ส่งข้อมูลไปเซิร์ฟเวอร์)
document.querySelectorAll(".modal form").forEach(function (form) {
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const d = new FormData(form);
    document.getElementById("okmsg").textContent =
      d.get("teacher") + " จะติดต่อผู้ปกครองที่เบอร์ " + d.get("tel") +
      " เพื่อยืนยันเวลาเรียน (" + d.get("subject") + " · " + d.get("grade") + " · " + d.get("mode") + " · " + d.get("time") + ")";
    form.reset();
    location.hash = "#ok";
  });
});

applyFilter();
