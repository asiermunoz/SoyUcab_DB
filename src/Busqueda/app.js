function $(id){ return document.getElementById(id); }
function normalize(s){ return String(s || "").toLowerCase().trim(); }

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{
    return fallback;
  }
}
function saveJSON(key, value){
  localStorage.setItem(key, JSON.stringify(value));
}

/* =========================
   AMIGOS / SOLICITUDES
   ========================= */
const FRIENDS_KEY = "soyucab_friends";           // [{a:"@x", b:"@y", createdAt:...}]
const REQ_KEY     = "soyucab_friend_requests";   // [{id, from, to, status, createdAt}]

function loadRequests(){
  const arr = loadJSON(REQ_KEY, []);
  return Array.isArray(arr) ? arr : [];
}
function saveRequests(arr){
  saveJSON(REQ_KEY, arr);
}
function loadFriends(){
  const arr = loadJSON(FRIENDS_KEY, []);
  return Array.isArray(arr) ? arr : [];
}
function saveFriends(arr){
  saveJSON(FRIENDS_KEY, arr);
}
function alreadyFriends(a, b){
  const friends = loadFriends();
  const A = normalize(a), B = normalize(b);
  return friends.some(f =>
    (normalize(f.a) === A && normalize(f.b) === B) ||
    (normalize(f.a) === B && normalize(f.b) === A)
  );
}
function requestExists(from, to){
  const req = loadRequests();
  const F = normalize(from), T = normalize(to);
  return req.some(r => normalize(r.from) === F && normalize(r.to) === T && r.status === "pendiente");
}
function incomingExists(from, to){
  const req = loadRequests();
  const F = normalize(from), T = normalize(to);
  return req.some(r => normalize(r.from) === F && normalize(r.to) === T && r.status === "pendiente");
}

/* =========================
   LECTURA DE USUARIOS (robusta)
   ========================= */
const candidates = [
  "soyucab_users",
  "soyucab_usuarios",
  "usuarios",
  "users",
  "app_users"
];

const profileCandidates = [
  "soyucab_profiles",
  "profiles",
  "perfil_data"
];

const demoFallback = [
  { username:"@persona_demo", role:"persona", displayName:"Persona Demo", avatarDataUrl:"" },
  { username:"@dependencia_ucab", role:"dependencia", displayName:"Dependencia UCAB", avatarDataUrl:"" },
  { username:"@org_demo", role:"organizacion", displayName:"Organización Demo", avatarDataUrl:"" }
];

function uniqByUsername(list){
  const map = new Map();
  list.forEach(u => {
    const key = normalize(u.username || u.user || u.handle || u.email);
    if (!key) return;
    if (!map.has(key)) map.set(key, u);
  });
  return Array.from(map.values());
}

function coerceUser(raw){
  const username = raw.username || raw.user || raw.handle || raw.usuario || raw.email || "";
  const role = raw.role || raw.tipo || raw.userType || raw.rol || "persona";

  const displayName =
    raw.displayName ||
    raw.name ||
    raw.nombre ||
    raw.fullName ||
    raw.abreviatura ||
    username;

  const avatarDataUrl =
    raw.avatarDataUrl ||
    raw.avatar ||
    (raw.profile && raw.profile.general && raw.profile.general.avatarDataUrl) ||
    (raw.general && raw.general.avatarDataUrl) ||
    "";

  const abbrev = raw.abreviatura || raw.abbrev || "";
  const extra = raw.tipoDependencia || raw.tipo || raw.sector || "";

  return { username, role, displayName, avatarDataUrl, abbrev, extra };
}

function readUsersFromStorage(){
  let out = [];

  // A) listas
  for (const key of candidates){
    const data = loadJSON(key, null);
    if (Array.isArray(data)) out = out.concat(data.map(coerceUser));
  }

  // B) perfiles (array o diccionario)
  for (const key of profileCandidates){
    const data = loadJSON(key, null);
    if (!data) continue;

    if (Array.isArray(data)) out = out.concat(data.map(coerceUser));
    else if (typeof data === "object"){
      Object.keys(data).forEach(k => out.push(coerceUser({ username: k, ...(data[k] || {}) })));
    }
  }

  // C) usuario actual
  const currentUser = localStorage.getItem("soyucab_usuario");
  const currentRole = localStorage.getItem("soyucab_role");
  if (currentUser){
    out.push(coerceUser({ username: currentUser, role: currentRole || "persona", displayName: currentUser }));
  }

  out = out.filter(u => u.username);
  out = uniqByUsername(out);

  if (out.length === 0) out = demoFallback.map(coerceUser);
  return out;
}

/* =========================
   UI
   ========================= */
const btnBack = $("btnBack");
const q = $("q");
const grid = $("grid");
const empty = $("emptyState");
const chips = Array.from(document.querySelectorAll(".chip"));

const reqList = $("reqList");
const reqEmpty = $("reqEmpty");

const friendsGrid = $("friendsGrid");
const friendsEmpty = $("friendsEmpty");

const profileOverlay = $("profileOverlay");
const btnCloseProfile = $("btnCloseProfile");
const btnCloseProfile2 = $("btnCloseProfile2");
const profileAvatar = $("profileAvatar");
const profileName = $("profileName");
const profileUser = $("profileUser");
const btnAddFriend = $("btnAddFriend");
const friendState = $("friendState");

let USERS = readUsersFromStorage();
let roleFilter = "all";
let selectedUser = null;

function roleLabel(r){
  if (r === "persona") return "Persona";
  if (r === "dependencia") return "Dependencia";
  if (r === "organizacion") return "Organización";
  return r;
}

function matches(u, query){
  const hay = [u.username, u.displayName, u.abbrev, u.extra].map(normalize).join(" | ");
  return hay.includes(query);
}

function initials(u){
  const name = (u.displayName || u.username || "").replace("@", "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const a = (parts[0] || "U")[0] || "U";
  const b = (parts[1] || "")[0] || "";
  return (a + b).toUpperCase();
}

function friendOther(me, f){
  const A = normalize(f.a);
  const B = normalize(f.b);
  const ME = normalize(me);
  if (A === ME) return f.b;
  if (B === ME) return f.a;
  return null;
}

/* ===== Modal perfil rápido ===== */
function openQuickProfile(u){
  selectedUser = u;

  if (!profileOverlay) return;

  if (profileAvatar){
    profileAvatar.innerHTML = "";
    if (u.avatarDataUrl){
      const img = document.createElement("img");
      img.src = u.avatarDataUrl;
      img.alt = "Foto de perfil";
      profileAvatar.appendChild(img);
    } else {
      profileAvatar.textContent = initials(u);
    }
  }

  if (profileName) profileName.textContent = u.displayName || u.username;
  if (profileUser) profileUser.textContent = u.username;

  const me = localStorage.getItem("soyucab_usuario") || "@usuario";
  const other = u.username;

  if (btnAddFriend && friendState){
    friendState.classList.add("hidden");
    friendState.textContent = "";

    if (normalize(me) === normalize(other)){
      btnAddFriend.disabled = true;
      btnAddFriend.textContent = "Tu perfil";
    } else if (alreadyFriends(me, other)){
      btnAddFriend.disabled = true;
      btnAddFriend.textContent = "✅ Ya son amigos";
    } else if (requestExists(me, other)){
      btnAddFriend.disabled = true;
      btnAddFriend.textContent = "⏳ Pendiente";
      friendState.textContent = "Pendiente de aceptación.";
      friendState.classList.remove("hidden");
    } else if (incomingExists(other, me)){
      btnAddFriend.disabled = true;
      btnAddFriend.textContent = "📩 Solicitud recibida";
      friendState.textContent = "Este usuario te envió una solicitud. Acepta o rechaza en 'Solicitudes'.";
      friendState.classList.remove("hidden");
    } else {
      btnAddFriend.disabled = false;
      btnAddFriend.textContent = "➕ Añadir amigo";
    }
  }

  profileOverlay.classList.remove("hidden");
  profileOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeQuickProfile(){
  if (!profileOverlay) return;
  profileOverlay.classList.add("hidden");
  profileOverlay.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

/* ===== Render resultados ===== */
function render(){
  if (!grid || !empty) return;

  USERS = readUsersFromStorage();

  const query = normalize(q?.value || "");
  let list = USERS.slice();

  if (roleFilter !== "all"){
    list = list.filter(u => normalize(u.role) === roleFilter);
  }

  if (query){
    list = list.filter(u => matches(u, query));
  }

  grid.innerHTML = "";

  if (list.length === 0){
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  list.forEach(u => {
    const card = document.createElement("div");
    card.className = "card";

    const avatarHTML = u.avatarDataUrl
      ? `<div class="avatar"><img src="${u.avatarDataUrl}" alt="Avatar"></div>`
      : `<div class="avatar">${initials(u)}</div>`;

    const extraBadge = u.abbrev ? `<span class="badge">Abrev: ${u.abbrev}</span>` : "";

    card.innerHTML = `
      ${avatarHTML}

      <div class="info">
        <p class="name">${u.displayName || u.username}</p>
        <p class="handle">${u.username}</p>

        <div class="badges">
          <span class="badge">${roleLabel(normalize(u.role))}</span>
          ${extraBadge}
        </div>
      </div>

      <div class="actions">
        <button class="btn" type="button" data-open>Ver perfil</button>
        <button class="btn ghost" type="button" data-copy>Copiar @</button>
      </div>
    `;

    card.querySelector("[data-copy]")?.addEventListener("click", async () => {
      try{
        await navigator.clipboard.writeText(u.username);
        alert("Usuario copiado.");
      }catch{
        alert("No se pudo copiar.");
      }
    });

    card.querySelector("[data-open]")?.addEventListener("click", () => {
      openQuickProfile(u);
    });

    grid.appendChild(card);
  });
}

/* ===== Render solicitudes ===== */
function renderRequests(){
  if (!reqList || !reqEmpty) return;

  const me = localStorage.getItem("soyucab_usuario") || "@usuario";
  const req = loadRequests().filter(r => r.status === "pendiente" && normalize(r.to) === normalize(me));

  reqList.innerHTML = "";

  if (req.length === 0){
    reqEmpty.classList.remove("hidden");
    return;
  }
  reqEmpty.classList.add("hidden");

  req.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0)).forEach(r => {
    const div = document.createElement("div");
    div.className = "reqItem";
    div.innerHTML = `
      <div class="reqInfo">
        <span>${r.from}</span>
        <small>Solicitud pendiente</small>
      </div>
      <div class="reqActions">
        <button class="ok" type="button" data-ok>Aceptar</button>
        <button class="no" type="button" data-no>Rechazar</button>
      </div>
    `;

    div.querySelector("[data-ok]")?.addEventListener("click", () => {
      const all = loadRequests();
      const idx = all.findIndex(x => x.id === r.id);
      if (idx !== -1) all[idx].status = "aceptada";
      saveRequests(all);

      if (!alreadyFriends(r.from, r.to)){
        const friends = loadFriends();
        friends.push({ a: r.from, b: r.to, createdAt: Date.now() });
        saveFriends(friends);
      }

      renderRequests();
      renderFriends();
      render();

      if (selectedUser && normalize(selectedUser.username) === normalize(r.from) && !profileOverlay.classList.contains("hidden")){
        openQuickProfile(selectedUser);
      }
    });

    div.querySelector("[data-no]")?.addEventListener("click", () => {
      const all = loadRequests();
      const idx = all.findIndex(x => x.id === r.id);
      if (idx !== -1) all[idx].status = "rechazada";
      saveRequests(all);

      renderRequests();
      renderFriends();
      render();

      if (selectedUser && normalize(selectedUser.username) === normalize(r.from) && !profileOverlay.classList.contains("hidden")){
        openQuickProfile(selectedUser);
      }
    });

    reqList.appendChild(div);
  });
}

/* ===== Render amigos ===== */
function renderFriends(){
  if (!friendsGrid || !friendsEmpty) return;

  const me = localStorage.getItem("soyucab_usuario") || "@usuario";
  const friends = loadFriends();

  const usernames = friends
    .map(f => friendOther(me, f))
    .filter(Boolean);

  USERS = readUsersFromStorage();

  const list = usernames
    .map(uName => USERS.find(u => normalize(u.username) === normalize(uName)) || { username: uName, displayName: uName, role:"persona", avatarDataUrl:"" })
    .sort((a,b) => normalize(a.displayName).localeCompare(normalize(b.displayName)));

  friendsGrid.innerHTML = "";

  if (list.length === 0){
    friendsEmpty.classList.remove("hidden");
    return;
  }
  friendsEmpty.classList.add("hidden");

  list.forEach(u => {
    const div = document.createElement("div");
    div.className = "friendCard";

    const avatarHTML = u.avatarDataUrl
      ? `<div class="friendAvatar"><img src="${u.avatarDataUrl}" alt="Avatar"></div>`
      : `<div class="friendAvatar">${initials(u)}</div>`;

    div.innerHTML = `
      <div class="friendLeft">
        ${avatarHTML}
        <div class="friendInfo">
          <p class="friendName">${u.displayName || u.username}</p>
          <p class="friendUser">${u.username}</p>
          <div class="friendBadges">
            <span class="badge">${roleLabel(normalize(u.role))}</span>
          </div>
        </div>
      </div>

      <div class="friendActions">
        <button class="btn ghost" type="button" data-open>Ver perfil</button>
        <button class="btn danger" type="button" data-del>Eliminar</button>
      </div>
    `;

    div.querySelector("[data-open]")?.addEventListener("click", () => openQuickProfile(u));

    div.querySelector("[data-del]")?.addEventListener("click", () => {
      const other = u.username;
      if (!confirm(`¿Eliminar a ${other} de tus amigos?`)) return;

      let friends = loadFriends();
      const ME = normalize(me);
      const OT = normalize(other);

      friends = friends.filter(f => {
        const A = normalize(f.a), B = normalize(f.b);
        return !((A === ME && B === OT) || (A === OT && B === ME));
      });

      saveFriends(friends);

      renderFriends();
      renderRequests();
      render();

      if (selectedUser && normalize(selectedUser.username) === OT && !profileOverlay.classList.contains("hidden")){
        openQuickProfile(selectedUser);
      }
    });

    friendsGrid.appendChild(div);
  });
}

/* ===== Enviar solicitud desde modal ===== */
if (btnAddFriend){
  btnAddFriend.addEventListener("click", () => {
    const me = localStorage.getItem("soyucab_usuario") || "@usuario";
    const other = selectedUser?.username || "";

    if (!other) return;

    if (normalize(me) === normalize(other)){
      alert("No puedes enviarte solicitud a ti mismo.");
      return;
    }

    if (alreadyFriends(me, other)){
      alert("Ya son amigos.");
      return;
    }

    if (requestExists(me, other)){
      alert("Ya enviaste una solicitud. Está pendiente.");
      return;
    }

    if (incomingExists(other, me)){
      alert("Este usuario ya te envió una solicitud. Acepta o rechaza en 'Solicitudes'.");
      return;
    }

    const req = loadRequests();
    req.push({
      id: "req_" + Date.now() + "_" + Math.random().toString(16).slice(2),
      from: me,
      to: other,
      status: "pendiente",
      createdAt: Date.now()
    });
    saveRequests(req);

    btnAddFriend.disabled = true;
    btnAddFriend.textContent = "⏳ Pendiente";
    if (friendState){
      friendState.textContent = "Pendiente de aceptación.";
      friendState.classList.remove("hidden");
    }

    renderRequests();
    renderFriends();
  });
}

/* ===== Listeners ===== */
if (btnBack) btnBack.addEventListener("click", () => history.back());
if (q) q.addEventListener("input", () => { render(); });

chips.forEach(ch => {
  ch.addEventListener("click", () => {
    chips.forEach(x => x.classList.remove("active"));
    ch.classList.add("active");
    roleFilter = ch.dataset.role || "all";
    render();
  });
});

if (btnCloseProfile) btnCloseProfile.addEventListener("click", closeQuickProfile);
if (btnCloseProfile2) btnCloseProfile2.addEventListener("click", closeQuickProfile);

if (profileOverlay){
  profileOverlay.addEventListener("click", (e) => {
    if (e.target === profileOverlay) closeQuickProfile();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && profileOverlay && !profileOverlay.classList.contains("hidden")){
    closeQuickProfile();
  }
});

/* ===== Start ===== */
render();
renderRequests();
renderFriends();