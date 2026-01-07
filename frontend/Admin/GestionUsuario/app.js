function $(id){ return document.getElementById(id); }
function normalize(s){ return String(s || "").trim().toLowerCase(); }
function normalizeUser(u){ return normalize(u).replace(/^@/, ""); }
function ensureAt(u){
  const s = String(u || "").trim();
  if (!s) return s;
  return s.startsWith("@") ? s : "@" + s;
}

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
   Claves / datos
   ========================== */
const USERS_KEY = "soyucab_users";

function getUsers(){
  let users = loadJSON(USERS_KEY, []);
  if (!Array.isArray(users)) users = [];

  // normaliza campos para que todo sea consistente
  return users.map(u => ({
    usuario: ensureAt(u.usuario || u.username || u.user || ""),
    correo: String(u.correo || u.email || "").trim(),
    contrasena: String(u.contrasena || u.password || ""),
    role: String(u.role || u.rol || u.tipo || "persona").toLowerCase()
  }));
}

function setUsers(users){
  saveJSON(USERS_KEY, users);
}

/* ==========================
   UI refs
   ========================== */
const tbody = $("tbodyUsers");
const empty = $("empty");

const q = $("q");
const roleFilter = $("roleFilter");

const btnNewUser = $("btnNewUser");
const btnBackAdmin = $("btnBackAdmin");
const btnLogout = $("btnLogout");

const modalOverlay = $("modalOverlay");
const modalTitle = $("modalTitle");
const btnCloseModal = $("btnCloseModal");
const btnCancel = $("btnCancel");

const formUser = $("formUser");
const editIndex = $("editIndex");
const inUsuario = $("usuario");
const inCorreo = $("correo");
const inPass = $("contrasena");
const inRole = $("role");
const btnTogglePass = $("btnTogglePass");

const msg = $("msg");

let CACHE = []; // usuarios ya filtrados/normalizados

function hideAdmin(users){
  return users.filter(u => u.role !== "admin");
}

function roleLabel(role){
  if (role === "persona") return "Persona";
  if (role === "dependencia") return "Dependencia";
  if (role === "organizacion") return "Organización";
  return role;
}

/* ==========================
   Render
   ========================== */
function render(){
  if (!tbody || !empty) return;

  const query = normalize(q?.value || "");
  const rf = String(roleFilter?.value || "all").toLowerCase();

  let users = hideAdmin(getUsers());

  if (rf !== "all"){
    users = users.filter(u => u.role === rf);
  }

  if (query){
    users = users.filter(u => {
      const hay = [u.usuario, u.correo, u.role].map(normalize).join(" | ");
      return hay.includes(query);
    });
  }

  // Cache de lo que se ve (para editar/eliminar)
  CACHE = users;

  tbody.innerHTML = "";

  if (users.length === 0){
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  users.forEach((u, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.usuario}</td>
      <td>${u.correo || "—"}</td>
      <td><span class="pill">${roleLabel(u.role)}</span></td>
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
   Modal helpers
   ========================== */
function openModal(mode, user, globalIndex){
  if (!modalOverlay) return;

  msg?.classList.add("hidden");
  msg && (msg.textContent = "");

  if (mode === "create"){
    modalTitle.textContent = "Registrar usuario";
    editIndex.value = "";
    inUsuario.value = "";
    inCorreo.value = "";
    inPass.value = "";
    inRole.value = "";
  } else {
    modalTitle.textContent = "Editar usuario";
    editIndex.value = String(globalIndex);
    inUsuario.value = user.usuario || "";
    inCorreo.value = user.correo || "";
    inPass.value = user.contrasena || "";
    inRole.value = user.role || "persona";
  }

  modalOverlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(){
  if (!modalOverlay) return;
  modalOverlay.classList.add("hidden");
  document.body.style.overflow = "";
}

/* ==========================
   Validación / CRUD
   ========================== */
function existsUserOrEmail(users, usuario, correo, ignoreIndex){
  const uNeedle = normalizeUser(usuario);
  const eNeedle = normalize(correo);

  return users.some((u, i) => {
    if (i === ignoreIndex) return false;
    const uu = normalizeUser(u.usuario);
    const ee = normalize(u.correo);
    return (uNeedle && uu === uNeedle) || (eNeedle && ee === eNeedle);
  });
}

function saveUserFromForm(){
  let users = getUsers(); // incluye admin, pero no lo tocamos
  const rawUsuario = String(inUsuario.value || "").trim();
  const usuario = ensureAt(rawUsuario);
  const correo = String(inCorreo.value || "").trim();
  const contrasena = String(inPass.value || "").trim();
  const role = String(inRole.value || "").toLowerCase();

  if (!usuario || usuario === "@"){
    msg.textContent = "Debes colocar un usuario válido.";
    msg.classList.remove("hidden");
    return;
  }
  if (!correo){
    msg.textContent = "Debes colocar un correo válido.";
    msg.classList.remove("hidden");
    return;
  }
  if (!contrasena){
    msg.textContent = "Debes colocar una contraseña.";
    msg.classList.remove("hidden");
    return;
  }
  if (!role || role === "admin"){
    msg.textContent = "Selecciona un rol válido (no admin).";
    msg.classList.remove("hidden");
    return;
  }

  // Encontrar índice real en el arreglo global (no CACHE)
  const editingCacheIndex = editIndex.value ? Number(editIndex.value) : null;

  if (editingCacheIndex === null){
    // CREATE
    if (existsUserOrEmail(users, usuario, correo, -1)){
      msg.textContent = "Ya existe un usuario o correo igual.";
      msg.classList.remove("hidden");
      return;
    }
    users.push({ usuario, correo, contrasena, role });
    setUsers(users);
    closeModal();
    render();
    return;
  }

  // EDIT: necesitamos mapear desde CACHE -> users global
  // Buscamos por usuario (antes) como identificador
  const oldUser = CACHE[editingCacheIndex];
  if (!oldUser){
    msg.textContent = "No se pudo editar (usuario no encontrado).";
    msg.classList.remove("hidden");
    return;
  }

  const globalIdx = users.findIndex(u => normalizeUser(u.usuario) === normalizeUser(oldUser.usuario));
  if (globalIdx === -1){
    msg.textContent = "No se pudo editar (usuario no encontrado en base).";
    msg.classList.remove("hidden");
    return;
  }

  if (users[globalIdx].role === "admin"){
    msg.textContent = "No puedes editar el usuario admin aquí.";
    msg.classList.remove("hidden");
    return;
  }

  if (existsUserOrEmail(users, usuario, correo, globalIdx)){
    msg.textContent = "Ya existe otro usuario o correo igual.";
    msg.classList.remove("hidden");
    return;
  }

  users[globalIdx] = { usuario, correo, contrasena, role };
  setUsers(users);
  closeModal();
  render();
}

function deleteUser(cacheIndex){
  let users = getUsers();
  const target = CACHE[cacheIndex];
  if (!target) return;

  const globalIdx = users.findIndex(u => normalizeUser(u.usuario) === normalizeUser(target.usuario));
  if (globalIdx === -1) return;

  if (users[globalIdx].role === "admin"){
    alert("No puedes eliminar el usuario admin.");
    return;
  }

  const ok = confirm(`¿Eliminar a ${users[globalIdx].usuario}?`);
  if (!ok) return;

  users.splice(globalIdx, 1);
  setUsers(users);

  render();
}

/* ==========================
   Eventos
   ========================== */
if (btnBackAdmin){
  btnBackAdmin.addEventListener("click", () => {
    window.location.href = "../admin.html";
  });
}

if (btnLogout){
  btnLogout.addEventListener("click", () => {
    localStorage.removeItem("soyucab_usuario");
    localStorage.removeItem("soyucab_role");
    localStorage.removeItem("soyucab_sesion");
    window.location.href = "../../login/index.html";
  });
}

if (btnNewUser){
  btnNewUser.addEventListener("click", () => openModal("create"));
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
if (roleFilter) roleFilter.addEventListener("change", render);

if (btnTogglePass){
  btnTogglePass.addEventListener("click", () => {
    if (!inPass) return;
    const isPass = inPass.type === "password";
    inPass.type = isPass ? "text" : "password";
    btnTogglePass.textContent = isPass ? "Ocultar" : "Ver";
  });
}

if (formUser){
  formUser.addEventListener("submit", (e) => {
    e.preventDefault();
    saveUserFromForm();
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
    const u = CACHE[idx];
    if (!u) return;
    openModal("edit", u, idx);
  }

  if (del !== null){
    const idx = Number(del);
    deleteUser(idx);
  }
});

/* ==========================
   Start
   ========================== */
render();