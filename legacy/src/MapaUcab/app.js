// =========================
// Botón volver
// =========================
document.getElementById("btnBack").addEventListener("click", () => {
  history.back();
});

// =========================
// Leaflet: mapa base
// =========================
const map = L.map("map", {
  zoomControl: true,
  attributionControl: false
}).setView([10.4806, -66.9036], 4); // Caracas

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19
}).addTo(map);

// =========================
// UI tarjeta superior
// =========================
const usernameEl = document.querySelector(".username");
const locationEl = document.querySelectorAll(".meta")[0];
const timeEl = document.querySelectorAll(".meta")[1];
const distanceEl = document.querySelector(".distance");

const avatarImg = document.getElementById("avatarImg");
const avatarEmoji = document.getElementById("avatarEmoji");

// =========================
// Pin dorado (igual para todos)
// =========================
const pinIcon = L.divIcon({
  className: "custom-pin",
  html: `
    <div style="
      width:20px;height:20px;
      background:#b48a1d;
      transform: rotate(45deg);
      border-radius:6px;
      position:relative;
      box-shadow:0 8px 16px rgba(180,138,29,.25);
    ">
      <div style="
        width:8px;height:8px;
        background:#fff;border-radius:50%;
        position:absolute;top:6px;left:6px;
        transform: rotate(-45deg);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 20]
});

// =========================
// Lista de usuarios (DEMO)
// Luego puedes reemplazar esto por datos reales de tu sistema
// =========================
const users = [
  {
    username: "@edcarmona",
    location: "Montalbán, Caracas",
    timeAgo: "Hace 2 min.",
    distance: "50km",
    coords: [10.4806, -66.9036]
  },
  {
    username: "@jgarcia",
    location: "Valencia, Carabobo",
    timeAgo: "Hace 8 min.",
    distance: "120km",
    coords: [10.1620, -68.0077]
  },
  {
    username: "@aamunoz",
    location: "Maracaibo, Zulia",
    timeAgo: "Hace 15 min.",
    distance: "710km",
    coords: [10.6545, -71.6444]
  },
  {
    username: "@dep.ucab",
    location: "UCAB, Caracas",
    timeAgo: "Hace 4 min.",
    distance: "0km",
    coords: [10.4719, -66.9795]
  },
  {
    username: "@org.asociada",
    location: "Barquisimeto, Lara",
    timeAgo: "Hace 22 min.",
    distance: "360km",
    coords: [10.0678, -69.3467]
  }
];

// =========================
// Marcadores dinámicos (layer group)
// =========================
const markersLayer = L.layerGroup().addTo(map);

// Map username -> marker
let currentMarkers = [];

// =========================
// Render tarjeta
// =========================
function renderCard(u) {
  usernameEl.textContent = u.username;
  locationEl.textContent = u.location;
  timeEl.textContent = u.timeAgo;
  distanceEl.textContent = u.distance;

  // avatar real desde perfil si existe
  try {
    const keyByUser = `soyucab_profile_${u.username}`;
    const profile =
      JSON.parse(localStorage.getItem(keyByUser)) ||
      JSON.parse(localStorage.getItem("soyucab_profile")) ||
      {};

    const url = profile?.general?.avatarDataUrl || "";
    if (url && url.startsWith("data:image/")) {
      avatarImg.src = url;
      avatarImg.style.display = "block";
      avatarEmoji.style.display = "none";
    } else {
      avatarImg.style.display = "none";
      avatarEmoji.style.display = "block";
    }
  } catch {
    avatarImg.style.display = "none";
    avatarEmoji.style.display = "block";
  }
}

// =========================
// Pintar marcadores según lista
// =========================
function drawMarkers(list) {
  markersLayer.clearLayers();
  currentMarkers = [];

  list.forEach(u => {
    const m = L.marker(u.coords, { icon: pinIcon })
      .addTo(markersLayer)
      .on("click", () => {
        renderCard(u);
        map.setView(u.coords, Math.max(map.getZoom(), 6), { animate: true });
      });

    m.bindTooltip(u.username, { direction: "top", offset: [0, -10] });
    currentMarkers.push(m);
  });

  // Ajustar mapa a los resultados
  if (list.length === 1) {
    map.setView(list[0].coords, 6);
  } else if (list.length > 1) {
    const group = L.featureGroup(currentMarkers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

// =========================
// Filtro del buscador
// =========================
const searchInput = document.getElementById("searchInput");

function normalize(s) {
  return String(s || "").toLowerCase().trim();
}

function filterUsers(query) {
  const q = normalize(query);
  if (!q) return users;

  return users.filter(u => {
    const user = normalize(u.username);
    const loc = normalize(u.location);
    return user.includes(q) || loc.includes(q);
  });
}

searchInput.addEventListener("input", () => {
  const filtered = filterUsers(searchInput.value);
  drawMarkers(filtered);

  // Si hay resultados, pon el primero en la tarjeta
  if (filtered.length > 0) renderCard(filtered[0]);
});

// =========================
// Inicializar vista
// =========================
drawMarkers(users);
renderCard(users[0]);