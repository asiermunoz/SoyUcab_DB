/* =========================================================
   Incluye:
   - Crear evento (campos completos)
   - Ver detalles (modal)
   - Asistencia + fecha/hora de inscripción (persona/org/dep)
   - Cambiar estado + Finalizar (solo admin/creador)
   - Editar evento (solo admin/creador)
   - Eliminar evento (solo admin/creador)
   - Buscador + filtros
   ========================================================= */

function $(id) { return document.getElementById(id); }
function normalize(s) { return String(s || "").toLowerCase().trim(); }

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function pad2(n) { return String(n).padStart(2, "0"); }
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseDate(dateYMD) {
  const [y, m, dd] = String(dateYMD).split("-").map(Number);
  return new Date(y, (m - 1), dd, 0, 0, 0, 0);
}
function formatDate(dateYMD) {
  const dt = parseDate(dateYMD);
  return dt.toLocaleDateString("es-VE", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}
function makeId() {
  return "ev_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("No se pudo leer la imagen"));
    r.onload = () => resolve(String(r.result || ""));
    r.readAsDataURL(file);
  });
}

function lock() { document.body.style.overflow = "hidden"; }
function unlock() { document.body.style.overflow = ""; }
function show(overlay) {
  if (!overlay) return;
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}
function hide(overlay) {
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

/* =========================
   Sesión / Usuario / Rol
   ========================= */
const currentUser = localStorage.getItem("soyucab_usuario") || "@usuario";
const currentRole = localStorage.getItem("soyucab_role") || "persona"; // persona | organizacion | dependencia

function getActor() {
  let actorType = "persona";
  if (currentRole === "organizacion") actorType = "organizacion";
  if (currentRole === "dependencia") actorType = "dependencia";
  return { type: actorType, name: currentUser };
}
function formatDateTime(ts) {
  const dt = new Date(ts);
  return dt.toLocaleString("es-VE", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}

/* =========================
   Grupos (para saber si soy admin)
   ========================= */
const GROUPS_KEY = "soyucab_groups_all";
const groups = loadJSON(GROUPS_KEY, []);
const adminGroups = Array.isArray(groups)
  ? groups.filter(g => normalize(g.admin) === normalize(currentUser))
  : [];

function canCreateEvents() {
  if (currentRole === "organizacion" || currentRole === "dependencia") return true;
  return adminGroups.length > 0; // persona solo si es admin de algún grupo
}

/* =========================
   Eventos (Storage)
   ========================= */
const KEY = "soyucab_events";
let events = loadJSON(KEY, []);
if (!Array.isArray(events)) events = [];

/* =========================
   Estado / UI
   ========================= */
let filter = "upcoming";
let coverDataUrl = "";
let activeEventId = null;
let editingEventId = null;

/* =========================
   DOM
   ========================= */
const btnBack = $("btnBack");
const btnCreate = $("btnCreate");
const q = $("q");
const grid = $("eventsGrid");
const empty = $("emptyState");
const chips = Array.from(document.querySelectorAll(".chip"));

// Detail modal
const detailOverlay = $("detailOverlay");
const btnCloseDetail = $("btnCloseDetail");
const btnCloseDetail2 = $("btnCloseDetail2");
const detailTitle = $("detailTitle");
const detailMeta = $("detailMeta");
const detailOwner = $("detailOwner");
const detailStatus = $("detailStatus");
const detailCategory = $("detailCategory");
const detailAddress = $("detailAddress");
const detailPlace = $("detailPlace");
const detailDesc = $("detailDesc");
const detailBanner = $("detailBanner");

const adminBox = $("adminBox");
const detailStatusSelect = $("detailStatusSelect");
const btnSaveStatus = $("btnSaveStatus");
const btnFinalize = $("btnFinalize");
const btnEditEvent = $("btnEditEvent");
const btnDeleteEvent = $("btnDeleteEvent");

// Attendance UI
const btnJoinEvent = $("btnJoinEvent");
const btnLeaveEvent = $("btnLeaveEvent");
const assistCount = $("assistCount");
const assistList = $("assistList");

// Create modal
const createOverlay = $("createOverlay");
const btnCloseCreate = $("btnCloseCreate");
const btnCancelCreate = $("btnCancelCreate");
const createForm = $("createForm");
const createError = $("createError");
const permissionNotice = $("permissionNotice");
const btnSubmitCreate = $("btnSubmitCreate");

const ev_title = $("ev_title");
const ev_date = $("ev_date");
const ev_desc = $("ev_desc");
const ev_category = $("ev_category");
const ev_status = $("ev_status");
const ev_address = $("ev_address");
const ev_place = $("ev_place");
const ev_ownerType = $("ev_ownerType");
const ownerGroupWrap = $("ownerGroupWrap");
const ev_ownerGroupId = $("ev_ownerGroupId");
const ev_ownerName = $("ev_ownerName");
const ev_cover = $("ev_cover");
const ev_coverPh = $("ev_coverPh");
const ev_coverImg = $("ev_coverImg");

/* =========================
   Helpers de eventos
   ========================= */
function isToday(ev) { return ev.date === todayYMD(); }

function isPast(ev) {
  const now = new Date();
  const dt = parseDate(ev.date);
  dt.setHours(23, 59, 59, 999);
  return dt < now && !isToday(ev);
}
function isUpcoming(ev) {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dt = parseDate(ev.date);
  return dt >= startToday || isToday(ev);
}

function statusLabel(s) {
  if (s === "borrador") return "Borrador";
  if (s === "publicado") return "Publicado";
  if (s === "en_curso") return "En curso";
  if (s === "finalizado") return "Finalizado";
  if (s === "archivado") return "Archivado";
  return s || "";
}

function badgeFor(ev) {
  if (isToday(ev)) return `<span class="badge today">Hoy</span>`;
  if (isPast(ev)) return `<span class="badge past">Pasado</span>`;
  return `<span class="badge">Próximo</span>`;
}

function canManageEvent(ev) {
  return normalize(ev.adminUser) === normalize(currentUser);
}

function filteredEvents() {
  const query = normalize(q?.value || "");

  return events
    .filter(ev => {
      if (!query) return true;
      return (
        normalize(ev.title).includes(query) ||
        normalize(ev.category).includes(query) ||
        normalize(ev.place).includes(query) ||
        normalize(ev.ownerName).includes(query) ||
        normalize(ev.address).includes(query)
      );
    })
    .filter(ev => {
      if (filter === "all") return true;
      if (filter === "today") return isToday(ev);
      if (filter === "past") return isPast(ev);
      return isUpcoming(ev);
    })
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
}

/* =========================
   Render listado
   ========================= */
function render() {
  if (!grid || !empty) return;

  const data = filteredEvents();
  grid.innerHTML = "";

  if (data.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  data.forEach(ev => {
    const card = document.createElement("article");
    card.className = "card";

    const bannerHTML = ev.coverDataUrl
      ? `<div class="banner"><img src="${ev.coverDataUrl}" alt="Portada"></div>`
      : `<div class="banner"></div>`;

    card.innerHTML = `
      ${bannerHTML}
      <div class="cardBody">
        <div class="badges">
          ${badgeFor(ev)}
          <span class="badge">${formatDate(ev.date)}</span>
          <span class="badge">${statusLabel(ev.status)}</span>
        </div>

        <h3 class="h2">${ev.title}</h3>
        <div class="meta">${ev.place} · ${ev.category}</div>
        <div class="meta">Hecho por: ${ev.ownerName}</div>

        <div class="actions">
          <button class="btn" type="button" data-action="detail">Ver detalles</button>
          <button class="btn ghost" type="button" data-action="share">Compartir</button>
        </div>
      </div>
    `;

    const bDetail = card.querySelector('[data-action="detail"]');
    if (bDetail) bDetail.addEventListener("click", () => openDetail(ev.id));

    const bShare = card.querySelector('[data-action="share"]');
    if (bShare) bShare.addEventListener("click", async () => {
      const text = `${ev.title} — ${formatDate(ev.date)} — ${ev.place} — ${ev.ownerName}`;
      try {
        if (navigator.share) await navigator.share({ title: ev.title, text });
        else {
          await navigator.clipboard.writeText(text);
          alert("Copiado al portapapeles.");
        }
      } catch {}
    });

    grid.appendChild(card);
  });
}

/* =========================
   Asistencia
   ========================= */
function renderAttendance(ev) {
  const list = Array.isArray(ev.attendance) ? ev.attendance : [];
  const actor = getActor();

  if (assistCount) assistCount.textContent = `${list.length} asistentes`;

  if (assistList) {
    assistList.innerHTML = "";
    if (list.length === 0) {
      assistList.innerHTML = `<p class="hint">Aún no hay inscripciones.</p>`;
    } else {
      list.slice().sort((a, b) => b.joinedAt - a.joinedAt).forEach(a => {
        const div = document.createElement("div");
        div.className = "assistItem";
        div.innerHTML = `
          <span>${String(a.type).toUpperCase()} · ${a.name}</span>
          <small>${formatDateTime(a.joinedAt)}</small>
        `;
        assistList.appendChild(div);
      });
    }
  }

  const already = list.some(a => normalize(a.name) === normalize(actor.name) && a.type === actor.type);

  if (btnJoinEvent) {
    btnJoinEvent.disabled = already;
    btnJoinEvent.style.opacity = already ? ".6" : "1";
  }
  if (btnLeaveEvent) {
    btnLeaveEvent.disabled = !already;
    btnLeaveEvent.style.opacity = !already ? ".6" : "1";
  }
}

/* =========================
   Detalles (modal)
   ========================= */
function openDetail(id) {
  const ev = events.find(x => x.id === id);
  if (!ev) return;

  activeEventId = id;

  if (detailTitle) detailTitle.textContent = ev.title;
  if (detailMeta) detailMeta.textContent = `${formatDate(ev.date)}`;
  if (detailOwner) detailOwner.textContent = `${String(ev.ownerType || "").toUpperCase()} · ${ev.ownerName}`;
  if (detailStatus) detailStatus.textContent = statusLabel(ev.status);
  if (detailCategory) detailCategory.textContent = ev.category;
  if (detailAddress) detailAddress.textContent = ev.address;
  if (detailPlace) detailPlace.textContent = ev.place;
  if (detailDesc) detailDesc.textContent = ev.desc;

  if (detailBanner) {
    detailBanner.innerHTML = "";
    if (ev.coverDataUrl) {
      const img = document.createElement("img");
      img.src = ev.coverDataUrl;
      img.alt = "Portada del evento";
      detailBanner.appendChild(img);
    }
  }

  // Admin UI
  const canManage = canManageEvent(ev);
  if (adminBox) adminBox.classList.toggle("hidden", !canManage);

  if (canManage && detailStatusSelect) detailStatusSelect.value = ev.status || "borrador";
  if (canManage && btnFinalize) {
    const canFinalize = ev.status !== "finalizado" && ev.status !== "archivado";
    btnFinalize.disabled = !canFinalize;
    btnFinalize.style.opacity = canFinalize ? "1" : ".6";
  }

  // Attendance
  renderAttendance(ev);

  lock();
  show(detailOverlay);
}

function closeDetail() {
  activeEventId = null;
  hide(detailOverlay);
  unlock();
}

/* =========================
   Crear/Editar (modal)
   ========================= */
function setCreateError(msg) {
  if (!createError) return;
  if (!msg) {
    createError.textContent = "";
    createError.classList.add("hidden");
    return;
  }
  createError.textContent = msg;
  createError.classList.remove("hidden");
}

function populateAdminGroupsSelect() {
  if (!ev_ownerGroupId) return;
  ev_ownerGroupId.innerHTML = "";

  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Selecciona";
  opt0.disabled = true;
  opt0.selected = true;
  ev_ownerGroupId.appendChild(opt0);

  adminGroups.forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = g.name;
    ev_ownerGroupId.appendChild(opt);
  });
}

function openCreate() {
  setCreateError("");
  coverDataUrl = "";

  const allowed = canCreateEvents();
  const isEditing = !!editingEventId;

  if (permissionNotice) {
    permissionNotice.textContent = allowed
      ? (isEditing ? "Editando evento (solo admin/creador)." : "Puedes crear un evento porque eres administrador.")
      : "No puedes crear eventos: solo administradores de grupo, organización o dependencia UCAB.";
  }

  if (btnSubmitCreate) {
    btnSubmitCreate.disabled = !allowed;
    btnSubmitCreate.style.opacity = allowed ? "1" : ".6";
  }

  // Limpieza
  if (ev_title) ev_title.value = "";
  if (ev_date) ev_date.value = todayYMD();
  if (ev_desc) ev_desc.value = "";
  if (ev_category) ev_category.value = "";
  if (ev_status) ev_status.value = "borrador";
  if (ev_address) ev_address.value = "";
  if (ev_place) ev_place.value = "";
  if (ev_ownerType) ev_ownerType.value = "";
  if (ev_ownerName) ev_ownerName.value = "";

  if (ownerGroupWrap) ownerGroupWrap.classList.add("hidden");
  if (ev_ownerGroupId) ev_ownerGroupId.innerHTML = "";

  if (ev_cover) ev_cover.value = "";
  if (ev_coverImg) {
    ev_coverImg.src = "";
    ev_coverImg.style.display = "none";
  }
  if (ev_coverPh) ev_coverPh.style.display = "block";

  // Prefill si editando
  if (editingEventId) {
    const ev = events.find(x => x.id === editingEventId);
    if (ev) {
      if (!canManageEvent(ev)) {
        setCreateError("No tienes permiso para editar este evento.");
        editingEventId = null;
      } else {
        if (ev_title) ev_title.value = ev.title || "";
        if (ev_date) ev_date.value = ev.date || todayYMD();
        if (ev_desc) ev_desc.value = ev.desc || "";
        if (ev_category) ev_category.value = ev.category || "";
        if (ev_status) ev_status.value = ev.status || "borrador";
        if (ev_address) ev_address.value = ev.address || "";
        if (ev_place) ev_place.value = ev.place || "";
        if (ev_ownerType) ev_ownerType.value = ev.ownerType || "";
        if (ev_ownerName) ev_ownerName.value = ev.ownerName || "";

        if (ev.ownerType === "grupo") {
          if (ownerGroupWrap) ownerGroupWrap.classList.remove("hidden");
          populateAdminGroupsSelect();
          if (ev_ownerGroupId) ev_ownerGroupId.value = ev.ownerId || "";
        } else {
          if (ownerGroupWrap) ownerGroupWrap.classList.add("hidden");
        }

        coverDataUrl = ev.coverDataUrl || "";
        if (ev_coverImg && coverDataUrl) {
          ev_coverImg.src = coverDataUrl;
          ev_coverImg.style.display = "block";
          if (ev_coverPh) ev_coverPh.style.display = "none";
        }
      }
    } else {
      editingEventId = null;
    }
  }

  lock();
  show(createOverlay);
}

function closeCreate() {
  editingEventId = null;
  hide(createOverlay);
  unlock();
}

/* Owner type comportamiento */
if (ev_ownerType) {
  ev_ownerType.addEventListener("change", () => {
    const t = ev_ownerType.value;

    if (t === "grupo") {
      if (ownerGroupWrap) ownerGroupWrap.classList.remove("hidden");
      populateAdminGroupsSelect();
      if (ev_ownerName) ev_ownerName.value = "";
      if (adminGroups.length === 0) setCreateError("No puedes crear eventos por grupo: no eres admin de ningún grupo.");
      else setCreateError("");
      return;
    }

    if (ownerGroupWrap) ownerGroupWrap.classList.add("hidden");
    if (ev_ownerGroupId) ev_ownerGroupId.innerHTML = "";

    if (t === "organizacion" || t === "dependencia") {
      if (ev_ownerName) ev_ownerName.value = currentUser;
      setCreateError("");
    } else {
      if (ev_ownerName) ev_ownerName.value = "";
    }
  });
}

if (ev_ownerGroupId) {
  ev_ownerGroupId.addEventListener("change", () => {
    const gid = ev_ownerGroupId.value;
    const g = adminGroups.find(x => x.id === gid);
    if (g && ev_ownerName) {
      ev_ownerName.value = g.name;
      setCreateError("");
    }
  });
}

/* Portada */
if (ev_cover) {
  ev_cover.addEventListener("change", async () => {
    const file = ev_cover.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("La portada debe ser una imagen.");
      ev_cover.value = "";
      return;
    }

    const MAX_MB = 8;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`Imagen muy grande. Máximo ${MAX_MB}MB.`);
      ev_cover.value = "";
      return;
    }

    coverDataUrl = await fileToDataURL(file);

    if (ev_coverImg) {
      ev_coverImg.src = coverDataUrl;
      ev_coverImg.style.display = "block";
    }
    if (ev_coverPh) ev_coverPh.style.display = "none";
  });
}

/* Guardar evento (crear o editar) */
if (createForm) {
  createForm.addEventListener("submit", (e) => {
    e.preventDefault();
    setCreateError("");

    if (!canCreateEvents()) {
      setCreateError("No tienes permisos para crear eventos.");
      return;
    }

    const title = (ev_title?.value || "").trim();
    const date = (ev_date?.value || "").trim();
    const desc = (ev_desc?.value || "").trim();
    const category = (ev_category?.value || "").trim();
    const status = (ev_status?.value || "").trim();
    const address = (ev_address?.value || "").trim();
    const place = (ev_place?.value || "").trim();
    const ownerType = (ev_ownerType?.value || "").trim();
    const ownerName = (ev_ownerName?.value || "").trim();
    const ownerId = ownerType === "grupo" ? (ev_ownerGroupId?.value || "") : "";

    if (!title || !date || !desc || !category || !status || !address || !place || !ownerType || !ownerName) {
      setCreateError("Completa todos los campos.");
      return;
    }

    if (ownerType === "grupo") {
      if (!ownerId) { setCreateError("Selecciona el grupo."); return; }
      const g = adminGroups.find(x => x.id === ownerId);
      if (!g) { setCreateError("No puedes crear evento para ese grupo (no eres admin)."); return; }
    }

    if (ownerType === "organizacion" && currentRole !== "organizacion") {
      setCreateError("Solo una organización puede crear eventos como organización.");
      return;
    }
    if (ownerType === "dependencia" && currentRole !== "dependencia") {
      setCreateError("Solo una dependencia UCAB puede crear eventos como dependencia.");
      return;
    }

    if (editingEventId) {
      const idx = events.findIndex(x => x.id === editingEventId);
      if (idx === -1) { setCreateError("No se encontró el evento a editar."); return; }
      if (!canManageEvent(events[idx])) { setCreateError("No tienes permiso para editar este evento."); return; }

      events[idx] = {
        ...events[idx],
        title, date, desc, category, status, address, place,
        ownerType, ownerId, ownerName,
        coverDataUrl: coverDataUrl || events[idx].coverDataUrl || ""
      };

      saveJSON(KEY, events);
      editingEventId = null;

    } else {
      const ev = {
        id: makeId(),
        title, date, desc, category, status, address, place,
        ownerType, ownerId, ownerName,
        adminUser: currentUser,
        coverDataUrl: coverDataUrl || "",
        createdAt: Date.now(),
        attendance: [] // ✅ asistencia
      };

      events.push(ev);
      saveJSON(KEY, events);
    }

    closeCreate();
    render();

    if (activeEventId) {
      const exists = events.find(x => x.id === activeEventId);
      if (exists) openDetail(activeEventId);
    }
  });
}

/* =========================
   Acciones admin (estado/finalizar/editar/eliminar)
   ========================= */
if (btnSaveStatus) {
  btnSaveStatus.addEventListener("click", () => {
    if (!activeEventId) return;
    const ev = events.find(x => x.id === activeEventId);
    if (!ev) return;

    if (!canManageEvent(ev)) { alert("No tienes permiso para cambiar el estado."); return; }
    const newStatus = detailStatusSelect ? detailStatusSelect.value : ev.status;
    ev.status = newStatus;
    saveJSON(KEY, events);

    openDetail(activeEventId);
    render();
  });
}

if (btnFinalize) {
  btnFinalize.addEventListener("click", () => {
    if (!activeEventId) return;
    const ev = events.find(x => x.id === activeEventId);
    if (!ev) return;

    if (!canManageEvent(ev)) { alert("No tienes permiso para finalizar este evento."); return; }
    if (ev.status === "finalizado" || ev.status === "archivado") {
      alert("Este evento ya está finalizado o archivado.");
      return;
    }

    if (!confirm("¿Finalizar este evento?")) return;

    ev.status = "finalizado";
    saveJSON(KEY, events);

    openDetail(activeEventId);
    render();
  });
}

if (btnEditEvent) {
  btnEditEvent.addEventListener("click", () => {
    if (!activeEventId) return;
    const ev = events.find(x => x.id === activeEventId);
    if (!ev) return;

    if (!canManageEvent(ev)) { alert("No tienes permiso para editar este evento."); return; }
    editingEventId = activeEventId;

    closeDetail();
    openCreate();
  });
}

if (btnDeleteEvent) {
  btnDeleteEvent.addEventListener("click", () => {
    if (!activeEventId) return;
    const ev = events.find(x => x.id === activeEventId);
    if (!ev) return;

    if (!canManageEvent(ev)) { alert("No tienes permiso para eliminar este evento."); return; }
    if (!confirm("¿Eliminar este evento definitivamente?")) return;

    events = events.filter(x => x.id !== activeEventId);
    saveJSON(KEY, events);

    closeDetail();
    render();
  });
}

/* =========================
   Asistencia (inscribirse/cancelar)
   ========================= */
if (btnJoinEvent) {
  btnJoinEvent.addEventListener("click", () => {
    if (!activeEventId) return;
    const ev = events.find(x => x.id === activeEventId);
    if (!ev) return;

    const actor = getActor();
    ev.attendance = Array.isArray(ev.attendance) ? ev.attendance : [];

    const exists = ev.attendance.some(a => normalize(a.name) === normalize(actor.name) && a.type === actor.type);
    if (exists) { alert("Ya estás inscrito en este evento."); return; }

    ev.attendance.push({
      type: actor.type,
      name: actor.name,
      joinedAt: Date.now() // ✅ fecha/hora automática de inscripción
    });

    saveJSON(KEY, events);
    openDetail(activeEventId);
    render();
  });
}

if (btnLeaveEvent) {
  btnLeaveEvent.addEventListener("click", () => {
    if (!activeEventId) return;
    const ev = events.find(x => x.id === activeEventId);
    if (!ev) return;

    const actor = getActor();
    ev.attendance = Array.isArray(ev.attendance) ? ev.attendance : [];

    ev.attendance = ev.attendance.filter(a =>
      !(normalize(a.name) === normalize(actor.name) && a.type === actor.type)
    );

    saveJSON(KEY, events);
    openDetail(activeEventId);
    render();
  });
}

/* =========================
   UI base (filtros / modales / escape / volver)
   ========================= */
if (btnBack) btnBack.addEventListener("click", () => history.back());
if (btnCreate) btnCreate.addEventListener("click", () => { editingEventId = null; openCreate(); });

if (btnCloseDetail) btnCloseDetail.addEventListener("click", closeDetail);
if (btnCloseDetail2) btnCloseDetail2.addEventListener("click", closeDetail);
if (detailOverlay) detailOverlay.addEventListener("click", (e) => { if (e.target === detailOverlay) closeDetail(); });

if (btnCloseCreate) btnCloseCreate.addEventListener("click", closeCreate);
if (btnCancelCreate) btnCancelCreate.addEventListener("click", closeCreate);
if (createOverlay) createOverlay.addEventListener("click", (e) => { if (e.target === createOverlay) closeCreate(); });

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (detailOverlay && !detailOverlay.classList.contains("hidden")) return closeDetail();
  if (createOverlay && !createOverlay.classList.contains("hidden")) return closeCreate();
});

if (q) q.addEventListener("input", render);

chips.forEach(btn => {
  btn.addEventListener("click", () => {
    chips.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter || "upcoming";
    render();
  });
});

/* =========================
   Start
   ========================= */
render();