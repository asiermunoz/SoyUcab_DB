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

const POSTS_KEY = "soyucab_posts"; 

function getPosts(){
  let arr = loadJSON(POSTS_KEY, []);
  if (!Array.isArray(arr)) arr = [];

  return arr.map(p => ({
    id: p.id || ("post_" + Date.now() + "_" + Math.random().toString(16).slice(2)),
    autor: p.autor || p.author || p.usuario || "",
    contenido: p.contenido || p.texto || p.content || "",
    createdAt: p.createdAt || p.fecha || Date.now(),
    adjuntos: Array.isArray(p.adjuntos) ? p.adjuntos : [] // ✅ NUEVO
  }));
}
function setPosts(arr){ saveJSON(POSTS_KEY, arr); }

function formatDate(ts){
  try{
    const d = new Date(ts);
    return d.toLocaleString("es-VE", { year:"numeric", month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
  }catch{
    return "—";
  }
}

/* UI */
const tbody = $("tbodyPosts");
const empty = $("empty");
const q = $("q");

const btnNewPost = $("btnNewPost");
const btnBackAdmin = $("btnBackAdmin");
const btnLogout = $("btnLogout");

const modalOverlay = $("modalOverlay");
const modalTitle = $("modalTitle");
const btnCloseModal = $("btnCloseModal");
const btnCancel = $("btnCancel");
const formPost = $("formPost");

const editId = $("editId");
const inAutor = $("autor");
const inContenido = $("contenido");
const inAdjuntos = $("adjuntos");
const previewAdjuntos = $("previewAdjuntos");
const inFecha = $("fecha");
const msg = $("msg");

let CACHE = [];
let PENDING_ATTACHMENTS = [];

function render(){
  if (!tbody || !empty) return;

  const query = normalize(q?.value || "");
  let posts = getPosts();

  if (query){
    posts = posts.filter(p => {
      const hay = [p.autor, p.contenido].map(normalize).join(" | ");
      return hay.includes(query);
    });
  }

  // más recientes primero
  posts.sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));

  CACHE = posts;
  tbody.innerHTML = "";

  if (posts.length === 0){
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  posts.forEach((p, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.autor || "Sistema"}</td>
      <td class="contentCell">
        ${escapeHTML(p.contenido)}
        ${p.adjuntos?.length ? `<div class="attCount">Adjuntos: ${p.adjuntos.length}</div>` : ""}
      </td>
      <td>${formatDate(p.createdAt)}</td>
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

function escapeHTML(str){
  return String(str || "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function readFileAsDataUrl(file){
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function niceType(mime){
  const m = String(mime || "").toLowerCase();
  if (m.startsWith("image/")) return "Imagen";
  if (m.startsWith("video/")) return "Video";
  if (m === "application/pdf") return "PDF";
  return "Archivo";
}

function renderPreview(){
  if (!previewAdjuntos) return;

  if (!PENDING_ATTACHMENTS.length){
    previewAdjuntos.innerHTML = "";
    return;
  }

  previewAdjuntos.innerHTML = PENDING_ATTACHMENTS.map((a, i) => {
    const t = niceType(a.mime);
    if ((a.mime || "").startsWith("image/")){
      return `
        <div class="attCard">
          <img src="${a.dataUrl}" alt="${escapeHTML(a.name)}">
          <div class="attMeta">
            <div class="attName">${escapeHTML(a.name)}</div>
            <div class="attType">${t}</div>
          </div>
          <button type="button" class="attX" data-att-del="${i}">✕</button>
        </div>
      `;
    }

    if ((a.mime || "").startsWith("video/")){
      return `
        <div class="attCard">
          <video src="${a.dataUrl}" controls></video>
          <div class="attMeta">
            <div class="attName">${escapeHTML(a.name)}</div>
            <div class="attType">${t}</div>
          </div>
          <button type="button" class="attX" data-att-del="${i}">✕</button>
        </div>
      `;
    }

    // PDF u otros
    return `
      <div class="attCard file">
        <div class="fileIcon">PDF</div>
        <div class="attMeta">
          <div class="attName">${escapeHTML(a.name)}</div>
          <div class="attType">${t}</div>
        </div>
        <a class="attOpen" href="${a.dataUrl}" target="_blank" rel="noopener">Abrir</a>
        <button type="button" class="attX" data-att-del="${i}">✕</button>
      </div>
    `;
  }).join("");
}


/* Modal */
function openModal(mode, post){
  msg?.classList.add("hidden");
  if (msg) msg.textContent = "";

  if (mode === "create"){
    modalTitle.textContent = "Crear publicación";
    editId.value = "";
    inAutor.value = localStorage.getItem("soyucab_usuario") || "Sistema";
    inContenido.value = "";
    inFecha.value = new Date().toLocaleString("es-VE");
    PENDING_ATTACHMENTS = [];
    if (inAdjuntos) inAdjuntos.value = "";
    if (previewAdjuntos) previewAdjuntos.innerHTML = "";
  } else {
    modalTitle.textContent = "Editar publicación";
    editId.value = post.id;
    inAutor.value = post.autor || "Sistema";
    inContenido.value = post.contenido || "";
    inFecha.value = formatDate(post.createdAt);
    PENDING_ATTACHMENTS = Array.isArray(post.adjuntos) ? [...post.adjuntos] : [];
    if (inAdjuntos) inAdjuntos.value = "";
    renderPreview();
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
  const autor = localStorage.getItem("soyucab_usuario") || "Sistema";
  const contenido = String(inContenido.value || "").trim();

  if (!contenido){
    msg.textContent = "El contenido no puede estar vacío.";
    msg.classList.remove("hidden");
    return;
  }

  let posts = getPosts();

  if (!id){
    posts.push({
      id: "post_" + Date.now() + "_" + Math.random().toString(16).slice(2),
      autor,
      contenido,
      createdAt: Date.now(),
      adjuntos: PENDING_ATTACHMENTS
    });
    setPosts(posts);
    closeModal();
    render();
    return;
  }

  const idx = posts.findIndex(x => String(x.id) === id);
  if (idx === -1){
    msg.textContent = "No se pudo editar (publicación no encontrada).";
    msg.classList.remove("hidden");
    return;
  }

  posts[idx] = { ...posts[idx], contenido,adjuntos: PENDING_ATTACHMENTS };
  setPosts(posts);
  closeModal();
  render();
}

function deletePost(cacheIndex){
  const target = CACHE[cacheIndex];
  if (!target) return;

  if (!confirm("¿Eliminar esta publicación?")) return;

  let posts = getPosts();
  posts = posts.filter(p => String(p.id) !== String(target.id));
  setPosts(posts);
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

if (btnNewPost) btnNewPost.addEventListener("click", () => openModal("create"));
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

if (formPost){
  formPost.addEventListener("submit", (e) => {
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
    const p = CACHE[Number(edit)];
    if (p) openModal("edit", p);
  }
  if (del !== null){
    deletePost(Number(del));
  }

  const attDel = t.getAttribute("data-att-del");
  if (attDel !== null){
    const i = Number(attDel);
    if (!Number.isNaN(i)){
      PENDING_ATTACHMENTS.splice(i, 1);
      renderPreview();
    }
  }
});

if (inAdjuntos){
  inAdjuntos.addEventListener("change", async () => {
    const files = Array.from(inAdjuntos.files || []);
    if (!files.length) return;

    // Límite suave para no romper localStorage
    const MAX_FILES = 6;
    const slice = files.slice(0, MAX_FILES);

    for (const f of slice){
      try{
        const dataUrl = await readFileAsDataUrl(f);
        PENDING_ATTACHMENTS.push({
          name: f.name,
          mime: f.type || "application/octet-stream",
          size: f.size || 0,
          dataUrl
        });
      }catch(e){
        console.error("No se pudo leer archivo", f?.name, e);
      }
    }

    // permite volver a escoger el mismo archivo
    inAdjuntos.value = "";
    renderPreview();
  });
}


render();