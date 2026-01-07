/* =========================================================
   SoyUCAB - Grupos
   - Crear/Editar Grupo (Modal)
   - Eliminar Grupo (Admin)
   - Chat por grupo (Modal)
   - Solicitudes para Privado/Secreto (Modal Admin)
   ========================================================= */

/* -----------------------------
   Utilidades
------------------------------ */
function $(id) { return document.getElementById(id); }

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function normalize(s) { return String(s || "").toLowerCase().trim(); }

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function formatMembers(n) {
  const v = Number(n || 0);
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace(".0", "") + "M miembros";
  if (v >= 1000) return (v / 1000).toFixed(1).replace(".0", "") + "K miembros";
  return v + " miembros";
}
function visibilityBadge(v) {
  if (v === "publico") return "Público";
  if (v === "privado") return "Privado";
  return "Secreto";
}
function makeId() {
  return "g_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}
function groupIconSVG() {
  return `
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Z" fill="#8a8a8a"/>
      <path d="M2 20c0-3 3-5 6-5s6 2 6 5" stroke="#8a8a8a" stroke-width="2" stroke-linecap="round"/>
      <path d="M12 20c0-3 3-5 6-5s6 2 6 5" stroke="#8a8a8a" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
}

/* -----------------------------
   Modal manager (anti-pegado)
------------------------------ */
let modalCount = 0;

function lockBodyScroll() {
  modalCount++;
  document.body.style.overflow = "hidden";
}
function unlockBodyScroll() {
  modalCount = Math.max(0, modalCount - 1);
  if (modalCount === 0) document.body.style.overflow = "";
}
function showOverlay(overlayEl) {
  if (!overlayEl) return;
  overlayEl.classList.remove("hidden");
  overlayEl.setAttribute("aria-hidden", "false");
  overlayEl.style.pointerEvents = "auto";
}
function hideOverlay(overlayEl) {
  if (!overlayEl) return;
  overlayEl.classList.add("hidden");
  overlayEl.setAttribute("aria-hidden", "true");
  overlayEl.style.pointerEvents = "none";
}

/* -----------------------------
   Usuario actual
------------------------------ */
const currentUser = localStorage.getItem("soyucab_usuario") || "@guest";
const currentRole = localStorage.getItem("soyucab_role") || "persona";

/* -----------------------------
   Storage keys
------------------------------ */
const joinKey = `soyucab_groups_joined_${currentUser}`; // legacy por usuario
const groupsKey = `soyucab_groups_all`;

// global
const membersKey = "soyucab_group_members";
const requestsKey = "soyucab_group_requests";

/* -----------------------------
   DOM refs
------------------------------ */
const btnBack = $("btnBack");
const searchInput = $("searchInput");
const btnFilter = $("btnFilter");
const filtersPanel = $("filtersPanel");
const onlyJoined = $("onlyJoined");
const onlyAdmin = $("onlyAdmin");
const listEl = $("groupsList");
const emptyEl = $("emptyState");

// Crear/Editar modal
const btnCreateGroup = $("btnCreateGroup");
const modalOverlay = $("modalOverlay");
const btnCloseModal = $("btnCloseModal");
const btnCancelModal = $("btnCancelModal");
const createGroupForm = $("createGroupForm");

const cgCover = $("cg_cover");
const coverImg = $("coverImg");
const coverPlaceholder = $("coverPlaceholder");

const cgName = $("cg_name");
const cgDesc = $("cg_desc");
const cgType = $("cg_type");
const cgDate = $("cg_date");
const cgCreator = $("cg_creator");
const cgRole = $("cg_role");
const formError = $("formError");

// Chat modal
const chatOverlay = $("chatOverlay");
const btnCloseChat = $("btnCloseChat");
const chatTitle = $("chatTitle");
const chatSubtitle = $("chatSubtitle");
const chatCover = $("chatCover");
const chatMessages = $("chatMessages");
const chatForm = $("chatForm");
const chatInput = $("chatInput");
const chatError = $("chatError");

// ✅ Adjuntos chat (ahora sí existen en DOM)
const chatFile = $("chatFile");
const btnAttach = $("btnAttach");
const btnClearAttach = $("btnClearAttach");
const chatAttachPreview = $("chatAttachPreview");

// Solicitudes modal (Admin)
const requestsOverlay = $("requestsOverlay");
const btnCloseRequests = $("btnCloseRequests");
const btnCloseRequests2 = $("btnCloseRequests2");
const requestsList = $("requestsList");
const requestsEmpty = $("requestsEmpty");

let activeChatGroupId = null;
let editingGroupId = null;
let coverDataUrlTemp = "";

// ✅ Adjuntos
let pendingAttachment = null; // { name, type, dataUrl }

/* -----------------------------
   Estado inicial overlays
------------------------------ */
hideOverlay(modalOverlay);
hideOverlay(chatOverlay);
hideOverlay(requestsOverlay);

/* -----------------------------
   Datos iniciales
------------------------------ */
const defaultGroups = [
  { id: "g1", name: "Grupo 1", admin: "@admin1", membersCount: 1100, visibility: "publico", createdAt: "2026-01-01", desc: "Grupo de ejemplo", coverDataUrl: "" },
  { id: "g2", name: "Grupo 2", admin: "@admin2", membersCount: 3000, visibility: "publico", createdAt: "2026-01-01", desc: "Grupo de ejemplo", coverDataUrl: "" },
];

let groups = loadJSON(groupsKey, null);
if (!Array.isArray(groups) || groups.length === 0) {
  groups = defaultGroups;
  saveJSON(groupsKey, groups);
}

let joinedIds = loadJSON(joinKey, []);
if (!Array.isArray(joinedIds)) joinedIds = [];

// Global members/requests
let groupMembers = loadJSON(membersKey, {});
if (!groupMembers || typeof groupMembers !== "object") groupMembers = {};

let groupRequests = loadJSON(requestsKey, {});
if (!groupRequests || typeof groupRequests !== "object") groupRequests = {};

// Inicializa: admin siempre miembro
groups.forEach(g => {
  if (!Array.isArray(groupMembers[g.id])) groupMembers[g.id] = [];
  if (!groupMembers[g.id].includes(g.admin)) groupMembers[g.id].push(g.admin);
});
saveJSON(membersKey, groupMembers);

function isJoinedLegacy(groupId) { return joinedIds.includes(groupId); }
function isMember(groupId, user) {
  const arr = groupMembers[groupId] || [];
  return arr.some(u => normalize(u) === normalize(user));
}
function hasPendingRequest(groupId, user) {
  const reqs = groupRequests[groupId] || [];
  return reqs.some(r => normalize(r.user) === normalize(user));
}
function addRequest(groupId) {
  if (!groupRequests[groupId]) groupRequests[groupId] = [];
  if (hasPendingRequest(groupId, currentUser)) return;

  groupRequests[groupId].push({ user: currentUser, role: currentRole, ts: Date.now() });
  saveJSON(requestsKey, groupRequests);
}
function removeRequest(groupId, user) {
  const reqs = groupRequests[groupId] || [];
  groupRequests[groupId] = reqs.filter(r => normalize(r.user) !== normalize(user));
  saveJSON(requestsKey, groupRequests);
}
function addMember(groupId, user) {
  if (!Array.isArray(groupMembers[groupId])) groupMembers[groupId] = [];
  if (!groupMembers[groupId].some(u => normalize(u) === normalize(user))) groupMembers[groupId].push(user);
  saveJSON(membersKey, groupMembers);
}
function removeMember(groupId, user) {
  const arr = groupMembers[groupId] || [];
  groupMembers[groupId] = arr.filter(u => normalize(u) !== normalize(user));
  saveJSON(membersKey, groupMembers);
}

/* -----------------------------
   Navegación
------------------------------ */
if (btnBack) btnBack.addEventListener("click", () => history.back());

/* -----------------------------
   Helpers UI error
------------------------------ */
function setFormError(msg) {
  if (!formError) return;
  if (!msg) {
    formError.classList.add("hidden");
    formError.textContent = "";
    return;
  }
  formError.textContent = msg;
  formError.classList.remove("hidden");
}

/* =========================================================
   ✅ ADJUNTOS: imágenes / videos / pdf (sin cambiar tu lógica)
   ========================================================= */
function clearAttachmentUI() {
  pendingAttachment = null;
  if (chatFile) chatFile.value = "";
  if (btnClearAttach) btnClearAttach.disabled = true;
  if (chatAttachPreview) {
    chatAttachPreview.innerHTML = "";
    chatAttachPreview.classList.add("hidden");
  }
}

function renderAttachmentPreview(att) {
  if (!chatAttachPreview) return;

  chatAttachPreview.classList.remove("hidden");

  const safeName = att.name || "archivo";
  const type = att.type || "";

  if (type.startsWith("image/")) {
    chatAttachPreview.innerHTML = `
      <div class="fileName">Adjunto: ${safeName}</div>
      <img src="${att.dataUrl}" alt="Imagen adjunta">
    `;
  } else if (type.startsWith("video/")) {
    chatAttachPreview.innerHTML = `
      <div class="fileName">Adjunto: ${safeName}</div>
      <video controls src="${att.dataUrl}"></video>
    `;
  } else if (type === "application/pdf") {
    chatAttachPreview.innerHTML = `
      <div class="pdfBox">
        <div class="fileName">Adjunto: ${safeName}</div>
        <a class="pdfLink" href="${att.dataUrl}" download="${safeName}">Descargar PDF</a>
        <iframe src="${att.dataUrl}"></iframe>
      </div>
    `;
  } else {
    chatAttachPreview.innerHTML = `
      <div class="fileName">Adjunto: ${safeName}</div>
      <div class="hint">Tipo no soportado.</div>
    `;
  }
}

if (btnAttach && chatFile) {
  btnAttach.addEventListener("click", () => chatFile.click());
}

if (btnClearAttach) {
  btnClearAttach.addEventListener("click", clearAttachmentUI);
}

if (chatFile) {
  chatFile.addEventListener("change", () => {
    const file = chatFile.files && chatFile.files[0];
    if (!file) return;

    const allowed =
      file.type.startsWith("image/") ||
      file.type.startsWith("video/") ||
      file.type === "application/pdf";

    if (!allowed) {
      alert("Solo se permiten imágenes, videos o archivos PDF.");
      clearAttachmentUI();
      return;
    }

    // Límite para no romper localStorage
    const MAX_MB = 50;
    if (file.size > MAX_MB * 1024 * 1024) {
      alert(`El archivo es muy grande. Máximo permitido: ${MAX_MB}MB.`);
      clearAttachmentUI();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      pendingAttachment = {
        name: file.name,
        type: file.type,
        dataUrl: String(reader.result || "")
      };
      if (btnClearAttach) btnClearAttach.disabled = false;
      renderAttachmentPreview(pendingAttachment);
    };
    reader.readAsDataURL(file);
  });
}

/* -----------------------------
   Crear/Editar Modal
------------------------------ */
function resetCoverPreview() {
  coverDataUrlTemp = "";
  if (coverImg) {
    coverImg.src = "";
    coverImg.style.display = "none";
  }
  if (coverPlaceholder) coverPlaceholder.style.display = "block";
  if (cgCover) cgCover.value = "";
}

function openCreateModal() {
  editingGroupId = null;
  setFormError("");

  if (cgDate) cgDate.value = todayISO();
  if (cgCreator) cgCreator.value = currentUser;
  if (cgRole) cgRole.value = currentRole;

  if (cgName) cgName.value = "";
  if (cgDesc) cgDesc.value = "";
  if (cgType) cgType.value = "";

  resetCoverPreview();

  lockBodyScroll();
  showOverlay(modalOverlay);
  setTimeout(() => cgName && cgName.focus(), 30);
}

function openEditModal(groupId) {
  const g = groups.find(x => x.id === groupId);
  if (!g) return;

  const amAdmin = normalize(g.admin) === normalize(currentUser);
  if (!amAdmin) {
    alert("Solo el administrador puede editar este grupo.");
    return;
  }

  editingGroupId = g.id;
  setFormError("");

  if (cgDate) cgDate.value = g.createdAt || "";
  if (cgCreator) cgCreator.value = g.admin || "";
  if (cgRole) cgRole.value = currentRole;

  if (cgName) cgName.value = g.name || "";
  if (cgDesc) cgDesc.value = g.desc || "";
  if (cgType) cgType.value = g.visibility || "publico";

  coverDataUrlTemp = g.coverDataUrl || "";
  if (coverDataUrlTemp && coverImg) {
    coverImg.src = coverDataUrlTemp;
    coverImg.style.display = "block";
    if (coverPlaceholder) coverPlaceholder.style.display = "none";
  } else {
    resetCoverPreview();
  }

  lockBodyScroll();
  showOverlay(modalOverlay);
  setTimeout(() => cgName && cgName.focus(), 30);
}

function closeCreateModal() {
  hideOverlay(modalOverlay);
  unlockBodyScroll();
}

if (btnCreateGroup) btnCreateGroup.addEventListener("click", openCreateModal);
if (btnCloseModal) btnCloseModal.addEventListener("click", closeCreateModal);
if (btnCancelModal) btnCancelModal.addEventListener("click", closeCreateModal);
if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeCreateModal();
  });
}

// Portada
if (cgCover) {
  cgCover.addEventListener("change", () => {
    const file = cgCover.files && cgCover.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("La portada debe ser una imagen.");
      cgCover.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      coverDataUrlTemp = String(reader.result || "");
      if (coverImg) {
        coverImg.src = coverDataUrlTemp;
        coverImg.style.display = "block";
      }
      if (coverPlaceholder) coverPlaceholder.style.display = "none";
    };
    reader.readAsDataURL(file);
  });
}

// Submit crear/editar
if (createGroupForm) {
  createGroupForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = (cgName?.value || "").trim();
    const desc = (cgDesc?.value || "").trim();
    const visibility = (cgType?.value || "").trim();

    if (!name || !desc || !visibility) {
      setFormError("Por favor completa nombre, descripción y tipo.");
      return;
    }

    const dup = groups.some(g => {
      if (editingGroupId && g.id === editingGroupId) return false;
      return normalize(g.name) === normalize(name);
    });
    if (dup) {
      setFormError("Ya existe un grupo con ese nombre.");
      return;
    }

    if (editingGroupId) {
      const target = groups.find(g => g.id === editingGroupId);
      if (!target) {
        setFormError("No se encontró el grupo a editar.");
        return;
      }
      const amAdmin = normalize(target.admin) === normalize(currentUser);
      if (!amAdmin) {
        setFormError("Solo el administrador puede editar este grupo.");
        return;
      }

      groups = groups.map(gr => {
        if (gr.id !== editingGroupId) return gr;
        return {
          ...gr,
          name,
          desc,
          visibility,
          coverDataUrl: coverDataUrlTemp || gr.coverDataUrl
        };
      });

      saveJSON(groupsKey, groups);
      editingGroupId = null;
    } else {
      const newGroup = {
        id: makeId(),
        name,
        desc,
        visibility,
        admin: currentUser,
        createdAt: todayISO(),
        membersCount: 1,
        coverDataUrl: coverDataUrlTemp || ""
      };

      groups = [newGroup, ...groups];
      saveJSON(groupsKey, groups);

      addMember(newGroup.id, currentUser);

      joinedIds = Array.from(new Set([newGroup.id, ...joinedIds]));
      saveJSON(joinKey, joinedIds);
    }

    closeCreateModal();
    render();
  });
}

/* -----------------------------
   Solicitudes (Admin Modal)
------------------------------ */
function openRequests(groupId) {
  const g = groups.find(x => x.id === groupId);
  if (!g) return;

  const amAdmin = normalize(g.admin) === normalize(currentUser);
  if (!amAdmin) {
    alert("Solo el administrador puede ver solicitudes.");
    return;
  }

  requestsOverlay.dataset.groupId = groupId;
  renderRequests(groupId);

  lockBodyScroll();
  showOverlay(requestsOverlay);
}

function closeRequests() {
  hideOverlay(requestsOverlay);
  unlockBodyScroll();
  if (requestsOverlay) requestsOverlay.dataset.groupId = "";
}

if (btnCloseRequests) btnCloseRequests.addEventListener("click", closeRequests);
if (btnCloseRequests2) btnCloseRequests2.addEventListener("click", closeRequests);
if (requestsOverlay) {
  requestsOverlay.addEventListener("click", (e) => {
    if (e.target === requestsOverlay) closeRequests();
  });
}

function renderRequests(groupId) {
  if (!requestsList || !requestsEmpty) return;

  const reqs = groupRequests[groupId] || [];
  requestsList.innerHTML = "";

  if (reqs.length === 0) {
    requestsEmpty.classList.remove("hidden");
    return;
  }
  requestsEmpty.classList.add("hidden");

  reqs.forEach(r => {
    const card = document.createElement("div");
    card.className = "reqCard";
    card.innerHTML = `
      <div class="reqLeft">
        <div class="reqUser">${r.user}</div>
        <div class="reqMeta">Rol: ${r.role}</div>
      </div>
      <div class="reqActions">
        <button class="btnOk" type="button">Aceptar</button>
        <button class="btnNo" type="button">Rechazar</button>
      </div>
    `;

    card.querySelector(".btnOk").addEventListener("click", () => {
      addMember(groupId, r.user);
      removeRequest(groupId, r.user);

      groups = groups.map(g => {
        if (g.id !== groupId) return g;
        return { ...g, membersCount: Math.max(0, (g.membersCount || 0) + 1) };
      });
      saveJSON(groupsKey, groups);

      renderRequests(groupId);
      render();
    });

    card.querySelector(".btnNo").addEventListener("click", () => {
      removeRequest(groupId, r.user);
      renderRequests(groupId);
      render();
    });

    requestsList.appendChild(card);
  });
}

/* -----------------------------
   Eliminar grupo (Admin)
------------------------------ */
function deleteGroup(groupId) {
  const g = groups.find(x => x.id === groupId);
  if (!g) return;

  const amAdmin = normalize(g.admin) === normalize(currentUser);
  if (!amAdmin) {
    alert("Solo el administrador puede eliminar este grupo.");
    return;
  }

  const ok = confirm(`¿Seguro que deseas eliminar el grupo "${g.name}"?\nEsta acción no se puede deshacer.`);
  if (!ok) return;

  if (activeChatGroupId === groupId) closeChat();
  if (requestsOverlay && requestsOverlay.dataset.groupId === groupId) closeRequests();

  groups = groups.filter(x => x.id !== groupId);
  saveJSON(groupsKey, groups);

  joinedIds = joinedIds.filter(id => id !== groupId);
  saveJSON(joinKey, joinedIds);

  localStorage.removeItem(`soyucab_group_messages_${groupId}`);

  delete groupRequests[groupId];
  saveJSON(requestsKey, groupRequests);

  delete groupMembers[groupId];
  saveJSON(membersKey, groupMembers);

  render();
}

/* -----------------------------
   Público: unir/salir directo
------------------------------ */
function toggleJoinPublic(groupId) {
  const g = groups.find(x => x.id === groupId);
  if (!g) return;

  const already = isMember(groupId, currentUser);

  if (already) {
    removeMember(groupId, currentUser);

    groups = groups.map(x => x.id === groupId
      ? { ...x, membersCount: Math.max(0, (x.membersCount || 0) - 1) }
      : x
    );
    saveJSON(groupsKey, groups);

    joinedIds = joinedIds.filter(id => id !== groupId);
    saveJSON(joinKey, joinedIds);
  } else {
    addMember(groupId, currentUser);

    groups = groups.map(x => x.id === groupId
      ? { ...x, membersCount: Math.max(0, (x.membersCount || 0) + 1) }
      : x
    );
    saveJSON(groupsKey, groups);

    joinedIds = Array.from(new Set([groupId, ...joinedIds]));
    saveJSON(joinKey, joinedIds);
  }

  render();
}

/* -----------------------------
   Chat
------------------------------ */
function msgKey(groupId) { return `soyucab_group_messages_${groupId}`; }
function loadMessages(groupId) {
  const arr = loadJSON(msgKey(groupId), []);
  return Array.isArray(arr) ? arr : [];
}
function saveMessages(groupId, arr) {
  try {
    localStorage.setItem(`soyucab_group_messages_${groupId}`, JSON.stringify(arr));
  } catch (e) {
    alert("No se pudo guardar el video porque el almacenamiento del navegador está lleno. Usa un video más corto o borra mensajes viejos.");
    console.error(e);
  }
}
function timeShort(ts) {
  try {
    const d = new Date(ts);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  } catch { return ""; }
}

function openChat(groupId) {
  if (modalOverlay && !modalOverlay.classList.contains("hidden")) {
    hideOverlay(modalOverlay);
  } else {
    lockBodyScroll();
  }

  const g = groups.find(x => x.id === groupId);
  if (!g) { unlockBodyScroll(); return; }

  const amAdmin = normalize(g.admin) === normalize(currentUser);
  const member = isMember(groupId, currentUser);

  if (!member && !amAdmin) {
    unlockBodyScroll();
    alert("Debes ser miembro del grupo para poder chatear.");
    return;
  }

  activeChatGroupId = groupId;

  if (chatTitle) chatTitle.textContent = `Chat: ${g.name}`;
  if (chatSubtitle) chatSubtitle.textContent = `${visibilityBadge(g.visibility)} • Admin: ${g.admin}`;

  if (chatCover) {
    chatCover.innerHTML = "";
    if (g.coverDataUrl) {
      const img = document.createElement("img");
      img.src = g.coverDataUrl;
      img.alt = "Portada";
      chatCover.appendChild(img);
    }
  }

  if (chatError) {
    chatError.classList.add("hidden");
    chatError.textContent = "";
  }

  clearAttachmentUI(); // ✅ limpia adjunto al abrir chat

  showOverlay(chatOverlay);
  renderMessages();
  setTimeout(() => chatInput && chatInput.focus(), 30);
}

function closeChat() {
  activeChatGroupId = null;
  hideOverlay(chatOverlay);
  unlockBodyScroll();
  clearAttachmentUI();
}

if (btnCloseChat) btnCloseChat.addEventListener("click", closeChat);
if (chatOverlay) {
  chatOverlay.addEventListener("click", (e) => {
    if (e.target === chatOverlay) closeChat();
  });
}

function isGroupAdmin(groupId) {
  const g = groups.find(x => x.id === groupId);
  if (!g) return false;
  return normalize(g.admin) === normalize(currentUser);
}

/* ====== Mensajes + adjuntos + editar/eliminar ====== */
function renderMessages() {
  if (!activeChatGroupId || !chatMessages) return;

  const msgs = loadMessages(activeChatGroupId);
  chatMessages.innerHTML = "";

  if (msgs.length === 0) {
    const p = document.createElement("div");
    p.style.color = "#64748b";
    p.style.fontWeight = "800";
    p.textContent = "Aún no hay mensajes. Escribe el primero 🙂";
    chatMessages.appendChild(p);
    return;
  }

  const amAdmin = isGroupAdmin(activeChatGroupId);

  msgs.forEach(m => {
    const mine = normalize(m.user) === normalize(currentUser);
    const canDelete = mine || amAdmin;
    const canEdit = mine || amAdmin;

    const row = document.createElement("div");
    row.className = "msgRow";

    const bubble = document.createElement("div");
    bubble.className = "msg" + (mine ? " me" : "");
    bubble.innerHTML = `
      <div class="meta">${m.user} • ${timeShort(m.ts)}</div>
      <div class="text"></div>
      ${m.editedAt ? `<div class="msgEdited">(Editado)</div>` : ``}
    `;
    bubble.querySelector(".text").textContent = m.text || "";

    // ✅ Adjuntos render
    if (m.attachment && m.attachment.dataUrl) {
      const type = m.attachment.type || "";
      const name = m.attachment.name || "archivo";

      const attachBox = document.createElement("div");
      attachBox.className = "attachPreview";
      attachBox.innerHTML = `<div class="fileName">Adjunto: ${name}</div>`;

      if (type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = m.attachment.dataUrl;
        img.alt = "Imagen adjunta";
        attachBox.appendChild(img);
      } else if (type.startsWith("video/")) {
        const video = document.createElement("video");
        video.controls = true;
        video.src = m.attachment.dataUrl;
        attachBox.appendChild(video);
      } else if (type === "application/pdf") {
        const link = document.createElement("a");
        link.className = "pdfLink";
        link.href = m.attachment.dataUrl;
        link.download = name;
        link.textContent = "Descargar PDF";

        const iframe = document.createElement("iframe");
        iframe.src = m.attachment.dataUrl;

        const pdfBox = document.createElement("div");
        pdfBox.className = "pdfBox";
        pdfBox.appendChild(link);
        pdfBox.appendChild(iframe);

        attachBox.appendChild(pdfBox);
      }

      bubble.appendChild(attachBox);
    }

    const actions = document.createElement("div");
    actions.className = "msgActions";

    if (canEdit) {
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "msgBtn";
      btnEdit.title = "Editar";
      btnEdit.textContent = "✏️";
      btnEdit.addEventListener("click", () => editMessagePrompt(m.id));
      actions.appendChild(btnEdit);
    }

    if (canDelete) {
      const btnDel = document.createElement("button");
      btnDel.type = "button";
      btnDel.className = "msgBtn danger";
      btnDel.title = "Eliminar";
      btnDel.textContent = "🗑️";
      btnDel.addEventListener("click", () => deleteMessage(m.id));
      actions.appendChild(btnDel);
    }

    row.appendChild(bubble);
    if (actions.children.length > 0) row.appendChild(actions);

    chatMessages.appendChild(row);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function deleteMessage(messageId) {
  if (!activeChatGroupId) return;

  const msgs = loadMessages(activeChatGroupId);
  const m = msgs.find(x => x.id === messageId);
  if (!m) return;

  const amAdmin = isGroupAdmin(activeChatGroupId);
  const mine = normalize(m.user) === normalize(currentUser);

  if (!mine && !amAdmin) {
    alert("No tienes permiso para eliminar este mensaje.");
    return;
  }

  const ok = confirm("¿Eliminar este mensaje?");
  if (!ok) return;

  const updated = msgs.filter(x => x.id !== messageId);
  saveMessages(activeChatGroupId, updated);
  renderMessages();
}

function editMessagePrompt(messageId) {
  if (!activeChatGroupId) return;

  const msgs = loadMessages(activeChatGroupId);
  const m = msgs.find(x => x.id === messageId);
  if (!m) return;

  const mine = normalize(m.user) === normalize(currentUser);
  if (!mine) {
    alert("Solo el autor puede editar este mensaje.");
    return;
  }

  const nuevo = prompt("Editar mensaje:", m.text || "");
  if (nuevo === null) return;

  const text = String(nuevo).trim();
  if (!text) {
    alert("El mensaje no puede quedar vacío.");
    return;
  }

  const updated = msgs.map(x => {
    if (x.id !== messageId) return x;
    return { ...x, text, editedAt: Date.now() };
  });

  saveMessages(activeChatGroupId, updated);
  renderMessages();
}

/* ✅ Enviar mensaje: texto y/o adjunto */
if (chatForm) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeChatGroupId) return;

    const text = (chatInput?.value || "").trim();
    if (!text && !pendingAttachment) return;

    const msgs = loadMessages(activeChatGroupId);

    msgs.push({
      id: "m_" + Date.now() + "_" + Math.random().toString(16).slice(2),
      user: currentUser,
      text,
      ts: Date.now(),
      attachment: pendingAttachment ? { ...pendingAttachment } : null
    });

    saveMessages(activeChatGroupId, msgs);

    if (chatInput) chatInput.value = "";
    clearAttachmentUI();
    renderMessages();
  });
}

/* -----------------------------
   Filtros y búsqueda
------------------------------ */
if (btnFilter && filtersPanel) {
  btnFilter.addEventListener("click", () => filtersPanel.classList.toggle("hidden"));
}

function getFiltered() {
  const q = normalize(searchInput?.value || "");
  const onlyJ = !!onlyJoined?.checked;
  const onlyA = !!onlyAdmin?.checked;

  return groups.filter(g => {
    const searching = q.length > 0;
    const amAdmin = normalize(g.admin) === normalize(currentUser);
    const member = isMember(g.id, currentUser) || isJoinedLegacy(g.id);

    if (searching && g.visibility === "secreto" && !(member || amAdmin)) return false;

    const matchesText =
      !q ||
      normalize(g.name).includes(q) ||
      normalize(g.admin).includes(q);

    if (!matchesText) return false;
    if (onlyJ && !member) return false;
    if (onlyA && !amAdmin) return false;

    return true;
  });
}

/* -----------------------------
   Render lista + Admin actions + Solicitudes
------------------------------ */
function render() {
  if (!listEl || !emptyEl) return;

  const data = getFiltered();
  listEl.innerHTML = "";

  if (data.length === 0) {
    emptyEl.classList.remove("hidden");
    return;
  }
  emptyEl.classList.add("hidden");

  data.forEach(g => {
    const amAdmin = normalize(g.admin) === normalize(currentUser);
    const member = isMember(g.id, currentUser) || isJoinedLegacy(g.id);
    const pending = hasPendingRequest(g.id, currentUser);

    let joinButtonHTML = "";
    if (g.visibility === "publico") {
      joinButtonHTML = `
        <button class="joinBtn ${member ? "joined" : ""}" type="button">
          ${member ? "Unido" : "Unirme"}
        </button>
      `;
    } else {
      if (member) {
        joinButtonHTML = `<button class="joinBtn joined" type="button">Unido</button>`;
      } else {
        joinButtonHTML = `
          <button class="requestBtn ${pending ? "sent" : ""}" type="button" ${pending ? "disabled" : ""}>
            ${pending ? "Solicitud enviada" : "Solicitar"}
          </button>
        `;
      }
    }

    const adminActions = amAdmin ? `
      <div class="adminActions">
        <button class="editBtn" type="button">Editar</button>
        <button class="editBtn reqBtn" type="button">Solicitudes</button>
        <button class="deleteBtn" type="button">Eliminar</button>
      </div>
    ` : "";

    const leftIcon = g.coverDataUrl
      ? `<img src="${g.coverDataUrl}" alt="Portada" class="miniCover">`
      : groupIconSVG();

    const card = document.createElement("article");
    card.className = "card";
    card.innerHTML = `
      <div class="left">
        <div class="iconGroup">${leftIcon}</div>
        <div class="info">
          <div class="titleRow">
            <h3 class="title">${g.name}</h3>
            <span class="admin">${amAdmin ? "Administrador (tú)" : "Administrador"}</span>
          </div>
          <div class="sub">${g.admin} • ${visibilityBadge(g.visibility)}</div>
          ${adminActions}
        </div>
      </div>

      <div class="right">
        <button class="chatBtn" type="button">Chat</button>

        <div class="members">
          <span>${formatMembers(g.membersCount)}</span>
        </div>

        ${joinButtonHTML}
      </div>
    `;

    card.querySelector(".chatBtn").addEventListener("click", () => openChat(g.id));

    const joinBtn = card.querySelector(".joinBtn");
    if (joinBtn && g.visibility === "publico") {
      joinBtn.addEventListener("click", () => toggleJoinPublic(g.id));
    }

    const requestBtn = card.querySelector(".requestBtn");
    if (requestBtn) {
      requestBtn.addEventListener("click", () => {
        addRequest(g.id);
        render();
      });
    }

    const editBtn = card.querySelector(".editBtn");
    if (editBtn) editBtn.addEventListener("click", () => openEditModal(g.id));

    const reqBtn = card.querySelector(".reqBtn");
    if (reqBtn) reqBtn.addEventListener("click", () => openRequests(g.id));

    const deleteBtn = card.querySelector(".deleteBtn");
    if (deleteBtn) deleteBtn.addEventListener("click", () => deleteGroup(g.id));

    listEl.appendChild(card);
  });
}

// Eventos
if (searchInput) searchInput.addEventListener("input", render);
if (onlyJoined) onlyJoined.addEventListener("change", render);
if (onlyAdmin) onlyAdmin.addEventListener("change", render);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  if (requestsOverlay && !requestsOverlay.classList.contains("hidden")) {
    closeRequests();
    return;
  }
  if (chatOverlay && !chatOverlay.classList.contains("hidden")) {
    closeChat();
    return;
  }
  if (modalOverlay && !modalOverlay.classList.contains("hidden")) {
    closeCreateModal();
  }
});

// Inicial
render();