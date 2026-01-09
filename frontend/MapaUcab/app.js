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
// Coordenadas conocidas para ciudades
// =========================
const cityCoords = {
  'Caracas, Venezuela': [10.4806, -66.9036],
  'Valencia, Venezuela': [10.1620, -68.0077],
  'Maracaibo, Venezuela': [10.6545, -71.6444],
  'Barquisimeto, Venezuela': [10.0678, -69.3467],
  'San Cristóbal, Venezuela': [7.7669, -72.2250],
  'Puerto Ordaz, Venezuela': [8.3077, -62.7142],
  'Margarita, Venezuela': [10.9667, -63.9167],
  'Madrid, España': [40.4168, -3.7038],
  'Barcelona, España': [41.3851, 2.1734],
  'Miami, Estados Unidos': [25.7617, -80.1918],
  'Orlando, Estados Unidos': [28.5383, -81.3792],
  'Bogotá, Colombia': [4.7110, -74.0721],
  'Medellín, Colombia': [6.2442, -75.5812],
  'Ciudad de Panamá, Panamá': [8.9824, -79.5199],
  'Santiago, Chile': [-33.4489, -70.6693],
  'Buenos Aires, Argentina': [-34.6118, -58.3966],
  'Lima, Perú': [-12.0464, -77.0428],
  'Ciudad de México, México': [19.4326, -99.1332],
  'Lisboa, Portugal': [38.7223, -9.1393],
  'Londres, Reino Unido': [51.5074, -0.1278]
};


// Función para obtener coordenadas
function getCoords(city, country) {
  const key = `${city}, ${country}`;
  return cityCoords[key] || [10.4806, -66.9036]; // Default Caracas
}

// Función para buscar usuarios
async function searchUsers(query) {
  try {
    const url = `/api/personas?q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Error al buscar usuarios');
    const data = await response.json();
    return data.map((p) => ({
      username: `@${p.username}`,
      location: `${p.ciudad}, ${p.pais}`,
      timeAgo: "Reciente",
      distance: "0km",
      coords: getCoords(p.ciudad, p.pais)
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// Marcadores dinámicos (layer group)
const markersLayer = L.layerGroup().addTo(map);


// Render tarjeta
function renderCard(u) {
  usernameEl.textContent = u.username;
  locationEl.textContent = u.location;
}


function drawMarkers(list) {
  markersLayer.clearLayers();
  if (list.length === 0) return;

  const markers = list.map(u => {
    const m = L.marker(u.coords, { icon: pinIcon })
      .addTo(markersLayer)
      .on("click", () => {
        renderCard(u);
        map.setView(u.coords, Math.max(map.getZoom(), 6), { animate: true });
      });

    m.bindTooltip(u.username, { direction: "top", offset: [0, -10] });
    return m;
  });

  // Ajustar mapa a los resultados
  if (list.length === 1) {
    map.setView(list[0].coords, 6);
  } else if (list.length > 1) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

// Buscador
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", async () => {
  const query = searchInput.value.trim();
  if (query) {
    const filtered = await searchUsers(query);
    drawMarkers(filtered);
    if (filtered.length > 0) {
      renderCard(filtered[0]);
    } else {
      // Resetear tarjeta
      document.querySelector('.username').textContent = 'No encontrado';
      document.querySelector('.meta').textContent = 'Intenta otra búsqueda';
    }
  } else {
    // Si no hay query, limpiar marcadores y resetear tarjeta
    drawMarkers([]);
    document.querySelector('.username').textContent = 'Busca a alguien';
    document.querySelector('.meta').textContent = 'para ver su ubicación';
  }
});