function $(id){ return document.getElementById(id); }
function normalize(s){ return String(s || "").trim().toLowerCase(); }

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

/* Guard admin */
(function guard(){
  const role = localStorage.getItem("soyucab_role");
  const user = localStorage.getItem("soyucab_usuario");
  if (!user || role !== "admin"){
    window.location.href = user ? "../Inicio/inicio.html" : "../../login/index.html";
  }
})();

const EVENTS_KEY = "soyucab_events"; 

function getEvents(){
  let arr = loadJSON(EVENTS_KEY, []);
  if (!Array.isArray(arr)) arr = [];
  return arr.map(e => ({
    id: e.id || ("evt_" + Date.now() + "_" + Math.random().toString(16).slice(2)),
    nombre: e.nombre || e.name || "",
    fechaEvento: e.fechaEvento || e.fecha || e.eventDate || "",
    descripcion: e.descripcion || e.description || "",
    nombreEntidad: e.nombreEntidad || e.entidad || e.groupName || "",
    creadoPor: e.creadoPor || e.creator || e.autor || "",
    estado: (e.estado || e.status || "borrador").toLowerCase(),
    categoria: e.categoria || e.category || "",
    direccion: e.direccion || e.address || "",
    lugarFisico: e.lugarFisico || e.lugar || e.venue || ""
  }));
}
function setEvents(arr){ saveJSON(EVENTS_KEY, arr); }

function estadoLabel(s){
  if (s === "borrador") return "Borrador";
  if (s === "publicado") return "Publicado";
  if (s === "en_curso") return "En curso";
  if (s === "finalizado") return "Finalizado";
  if (s === "archivado") return "Archivado";
  return s;
}

/* UI */
const tbody = $("tbodyEvents");
const empty = $("empty");
const q = $("q");
const statusFilter = $("statusFilter");

const btnNewEvent = $("btnNewEvent");
const btnBackAdmin = $("btnBackAdmin");
const btnLogout = $("btnLogout");

const modalOverlay = $("modalOverlay");
const modalTitle = $("modalTitle");
const btnCloseModal = $("btnCloseModal");
const btnCancel = $("btnCancel");
const formEvent = $("formEvent");

const editId = $("editId");
const inNombre = $("nombre");
const inFecha = $("fechaEvento");
const inDesc = $("descripcion");
const inEntidad = $("nombreEntidad");
const inCreador = $("creadoPor");
const inEstado = $("estado");
const inCategoria = $("categoria");
const inDireccion = $("direccion");
const inLugar = $("lugarFisico");
const msg = $("msg");

let CACHE = [];

function render(){
  if (!tbody || !empty) return;

  const query = normalize(q?.value || "");
  const sf = String(statusFilter?.value || "all").toLowerCase();

  let events = getEvents();

  if (sf !== "all"){
    events = events.filter(e => normalize(e.estado) === sf);
  }
  if (query){
    events = events.filter(e => {
      const hay = [e.nombre, e.estado, e.categoria, e.creadoPor, e.nombreEntidad].map(normalize).join(" | ");
      return hay.includes(query);
    });
  }

  CACHE = events;
  tbody.innerHTML = "";

  if (events.length === 0){
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  events.forEach((e, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.nombre}</td>
      <td>${e.fechaEvento || "—"}</td>
      <td><span class="pill">${estadoLabel(e.estado)}</span></td>
      <td>${e.creadoPor || "Sistema"}</td>
      <td class="actionsCell">
        <div class="rowBtns">
          <button class="btn ghost" type="button" data-edit="${idx}">Editar</button>
          <button class="btn danger" type="button" data-del="${idx}">Eliminar</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* Modal */
function openModal(mode, evt){
  msg?.classList.add("hidden");
  if (msg) msg.textContent = "";

  if (mode === "create"){
    modalTitle.textContent = "Crear evento";
    editId.value = "";
    inNombre.value = "";
    inFecha.value = "";
    inDesc.value = "";
    inEntidad.value = "";
    inEstado.value = "borrador";
    inCategoria.value = "";
    inDireccion.value = "";
    inLugar.value = "";
    inCreador.value = localStorage.getItem("soyucab_usuario") || "Sistema";
  } else {
    modalTitle.textContent = "Editar evento";
    editId.value = evt.id;
    inNombre.value = evt.nombre;
    inFecha.value = evt.fechaEvento || "";
    inDesc.value = evt.descripcion;
    inEntidad.value = evt.nombreEntidad;
    inEstado.value = evt.estado;
    inCategoria.value = evt.categoria;
    inDireccion.value = evt.direccion;
    inLugar.value = evt.lugarFisico;
    inCreador.value = evt.creadoPor || "Sistema";
  }

  modalOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeModal(){
  modalOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

/* CRUD */
function saveFromForm(){
  const id = String(editId.value || "");
  const nombre = String(inNombre.value || "").trim();
  const fechaEvento = String(inFecha.value || "").trim();
  const descripcion = String(inDesc.value || "").trim();
  const nombreEntidad = String(inEntidad.value || "").trim();
  const estado = String(inEstado.value || "").toLowerCase();
  const categoria = String(inCategoria.value || "").trim();
  const direccion = String(inDireccion.value || "").trim();
  const lugarFisico = String(inLugar.value || "").trim();
  const creadoPor = localStorage.getItem("soyucab_usuario") || "Sistema";

  if (!nombre || !fechaEvento || !descripcion || !nombreEntidad || !estado || !categoria || !direccion || !lugarFisico){
    msg.textContent = "Completa todos los campos del evento.";
    msg.classList.remove("hidden");
    return;
  }

  let events = getEvents();

  if (!id){
    events.push({
      id: "evt_" + Date.now() + "_" + Math.random().toString(16).slice(2),
      nombre, fechaEvento, descripcion,
      nombreEntidad, creadoPor, estado,
      categoria, direccion, lugarFisico
    });
    setEvents(events);
    closeModal();
    render();
    return;
  }

  const idx = events.findIndex(x => String(x.id) === id);
  if (idx === -1){
    msg.textContent = "No se pudo editar (evento no encontrado).";
    msg.classList.remove("hidden");
    return;
  }

  events[idx] = { ...events[idx],
    nombre, fechaEvento, descripcion,
    nombreEntidad, estado, categoria, direccion, lugarFisico
  };

  setEvents(events);
  closeModal();
  render();
}

function deleteEvent(cacheIndex){
  const target = CACHE[cacheIndex];
  if (!target) return;

  if (!confirm(`¿Eliminar el evento "${target.nombre}"?`)) return;

  let events = getEvents();
  events = events.filter(e => String(e.id) !== String(target.id));
  setEvents(events);
  render();
}

/* Listeners */
if (btnBackAdmin) btnBackAdmin.addEventListener("click", () => window.location.href = "../admin.html");
if (btnLogout) btnLogout.addEventListener("click", () => {
  localStorage.removeItem("soyucab_usuario");
  localStorage.removeItem("soyucab_role");
  localStorage.removeItem("soyucab_sesion");
  window.location.href = "../../login/index.html";
});

if (btnNewEvent) btnNewEvent.addEventListener("click", () => openModal("create"));
if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
if (btnCancel) btnCancel.addEventListener("click", closeModal);

if (modalOverlay){
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay && !modalOverlay.classList.contains("hidden")) closeModal();
});

if (q) q.addEventListener("input", render);
if (statusFilter) statusFilter.addEventListener("change", render);

if (formEvent){
  formEvent.addEventListener("submit", (e) => {
    e.preventDefault();
    saveFromForm();
  });
}

document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  const edit = t.getAttribute("data-edit");
  const del = t.getAttribute("data-del");

  if (edit !== null){
    const evt = CACHE[Number(edit)];
    if (evt) openModal("edit", evt);
  }
  if (del !== null){
    deleteEvent(Number(del));
  }
});

render();