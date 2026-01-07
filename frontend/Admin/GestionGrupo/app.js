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

/* ==========================
   PROTECCIÓN: solo admin
   ========================== */
(function guard(){
  const role = localStorage.getItem("soyucab_role");
  const user = localStorage.getItem("soyucab_usuario");
  if (!user || role !== "admin"){
    window.location.href = user ? "../Inicio/inicio.html" : "../../login/index.html";
  }
})();

/* ==========================
   Fuente de datos (grupos)
   ========================== */
const GROUPS_KEY = "soyucab_groups"; // si tu app usa otra llave, cambia aquí

function getGroups(){
  let groups = loadJSON(GROUPS_KEY, []);
  if (!Array.isArray(groups)) groups = [];
  return groups.map(g => ({
    id: g.id || ("grp_" + Date.now() + "_" + Math.random().toString(16).slice(2)),
    nombre: g.nombre || g.name || "",
    descripcion: g.descripcion || g.description || "",
    tipo: (g.tipo || g.type || "publico").toLowerCase(),
    fechaCreacion: g.fechaCreacion || g.fecha || g.createdAt || Date.now(),
    creador: g.creador || g.creator || "Sistema"
  }));
}

function setGroups(groups){
  saveJSON(GROUPS_KEY, groups);
}

function formatDate(ts){
  try{
    const d = new Date(ts);
    return d.toLocaleDateString("es-VE", { year:"numeric", month:"2-digit", day:"2-digit" });
  }catch{
    return "—";
  }
}

function typeLabel(t){
  if (t === "publico") return "Público";
  if (t === "privado") return "Privado";
  if (t === "secreto") return "Secreto";
  return t;
}

/* ==========================
   UI refs
   ========================== */
const tbody = $("tbodyGroups");
const empty = $("empty");

const q = $("q");
const typeFilter = $("typeFilter");

const btnNewGroup = $("btnNewGroup");
const btnBackAdmin = $("btnBackAdmin");
const btnLogout = $("btnLogout");

const modalOverlay = $("modalOverlay");
const modalTitle = $("modalTitle");
const btnCloseModal = $("btnCloseModal");
const btnCancel = $("btnCancel");

const formGroup = $("formGroup");
const editId = $("editId");
const inNombre = $("nombre");
const inDesc = $("descripcion");
const inTipo = $("tipo");
const inCreador = $("creador");
const inFecha = $("fecha");
const msg = $("msg");

let CACHE = [];

function render(){
  if (!tbody || !empty) return;

  const query = normalize(q?.value || "");
  const tf = String(typeFilter?.value || "all").toLowerCase();

  let groups = getGroups();

  if (tf !== "all"){
    groups = groups.filter(g => normalize(g.tipo) === tf);
  }
  if (query){
    groups = groups.filter(g => {
      const hay = [g.nombre, g.descripcion, g.tipo, g.creador].map(normalize).join(" | ");
      return hay.includes(query);
    });
  }

  CACHE = groups;

  tbody.innerHTML = "";

  if (groups.length === 0){
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  groups.forEach((g, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${g.nombre}</td>
      <td><span class="pill">${typeLabel(g.tipo)}</span></td>
      <td>${formatDate(g.fechaCreacion)}</td>
      <td>${g.creador || "Sistema"}</td>
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

/* ==========================
   Modal
   ========================== */
function openModal(mode, group){
  msg?.classList.add("hidden");
  if (msg) msg.textContent = "";

  if (mode === "create"){
    modalTitle.textContent = "Crear grupo";
    editId.value = "";
    inNombre.value = "";
    inDesc.value = "";
    inTipo.value = "";
    inCreador.value = localStorage.getItem("soyucab_usuario") || "Sistema";
    inFecha.value = new Date().toLocaleDateString("es-VE");
  } else {
    modalTitle.textContent = "Editar grupo";
    editId.value = group.id;
    inNombre.value = group.nombre;
    inDesc.value = group.descripcion;
    inTipo.value = group.tipo;
    inCreador.value = group.creador || "Sistema";
    inFecha.value = formatDate(group.fechaCreacion);
  }

  modalOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(){
  modalOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

/* ==========================
   CRUD
   ========================== */
function saveFromForm(){
  let groups = getGroups();
  const id = editId.value ? String(editId.value) : "";
  const nombre = String(inNombre.value || "").trim();
  const descripcion = String(inDesc.value || "").trim();
  const tipo = String(inTipo.value || "").toLowerCase();

  if (!nombre){
    msg.textContent = "El nombre del grupo es obligatorio.";
    msg.classList.remove("hidden");
    return;
  }
  if (!descripcion){
    msg.textContent = "La descripción es obligatoria.";
    msg.classList.remove("hidden");
    return;
  }
  if (!tipo){
    msg.textContent = "Selecciona el tipo de grupo.";
    msg.classList.remove("hidden");
    return;
  }

  if (!id){
    // CREATE
    groups.push({
      id: "grp_" + Date.now() + "_" + Math.random().toString(16).slice(2),
      nombre,
      descripcion,
      tipo,
      fechaCreacion: Date.now(),
      creador: localStorage.getItem("soyucab_usuario") || "Sistema"
    });
    setGroups(groups);
    closeModal();
    render();
    return;
  }

  // EDIT
  const idx = groups.findIndex(g => String(g.id) === id);
  if (idx === -1){
    msg.textContent = "No se pudo editar (grupo no encontrado).";
    msg.classList.remove("hidden");
    return;
  }

  groups[idx] = {
    ...groups[idx],
    nombre,
    descripcion,
    tipo
  };

  setGroups(groups);
  closeModal();
  render();
}

function deleteGroup(cacheIndex){
  let groups = getGroups();
  const target = CACHE[cacheIndex];
  if (!target) return;

  const ok = confirm(`¿Eliminar el grupo "${target.nombre}"?`);
  if (!ok) return;

  groups = groups.filter(g => String(g.id) !== String(target.id));
  setGroups(groups);
  render();
}

/* ==========================
   Eventos
   ========================== */
if (btnBackAdmin){
  btnBackAdmin.addEventListener("click", () => window.location.href = "../admin.html");
}
if (btnLogout){
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("soyucab_usuario");
    localStorage.removeItem("soyucab_role");
    localStorage.removeItem("soyucab_sesion");
    window.location.href = "../../login/index.html";
  });
}

if (btnNewGroup){
  btnNewGroup.addEventListener("click", () => openModal("create"));
}

if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
if (btnCancel) btnCancel.addEventListener("click", closeModal);

if (modalOverlay){
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay && !modalOverlay.classList.contains("hidden")){
    closeModal();
  }
});

if (q) q.addEventListener("input", render);
if (typeFilter) typeFilter.addEventListener("change", render);

if (formGroup){
  formGroup.addEventListener("submit", (e) => {
    e.preventDefault();
    saveFromForm();
  });
}

// Delegación para editar/eliminar
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;

  const edit = t.getAttribute("data-edit");
  const del = t.getAttribute("data-del");

  if (edit !== null){
    const idx = Number(edit);
    const g = CACHE[idx];
    if (!g) return;
    openModal("edit", g);
  }
  if (del !== null){
    const idx = Number(del);
    deleteGroup(idx);
  }
});

render();