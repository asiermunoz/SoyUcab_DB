// ✅ Proteger: si NO hay sesión, volver al login
if (!localStorage.getItem("soyucab_sesion")) {
  window.location.href = "/login";
}

// Logout
const btnLogout = document.getElementById("btnLogout");
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("soyucab_sesion");
  localStorage.removeItem("soyucab_usuario");
  localStorage.removeItem("soyucab_role");
  localStorage.removeItem("soyucab_profile"); // para que no se mezclen perfiles
  window.location.href = "/login";
});

// Helpers
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
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

const currentUser = localStorage.getItem("soyucab_usuario") || "@usuario";
const likes = loadJSON("soyucab_likes", {});
const comments = loadJSON("soyucab_comments", {}); // { postId: [{user,text,ts,attachment,edited}, ...] }

// ===============================
// ✅ PUBLICACIONES (CRUD)
// ===============================
let posts = [];

const postsMount = document.getElementById("postsMount");

// Load posts from API
async function loadPosts() {
  try {
    const resp = await fetch('/api/posts');
    if (!resp.ok) throw new Error('Error loading posts');
    const data = await resp.json();
    posts = data.map(p => ({
      id: p.id_publicacion,
      user: p.username,
      text: p.contenido,
      ts: new Date(p.fecha).getTime(),
      attachment: null // TODO: handle attachments
    }));
    renderPosts();
  } catch (err) {
    console.error('Error loading posts:', err);
    posts = [];
    renderPosts();
  }
}

// Crear publicación UI
const postForm = document.getElementById("postForm");
const postInput = document.getElementById("postInput");
const postFile = document.getElementById("postFile");
const postFileName = document.getElementById("postFileName");
const postClearFile = document.getElementById("postClearFile");
const postError = document.getElementById("postError");

let selectedPostFile = null;

function setPostError(msg) {
  if (!postError) return;
  if (!msg) {
    postError.classList.add("hidden");
    postError.textContent = "";
    return;
  }
  postError.textContent = msg;
  postError.classList.remove("hidden");
}

if (postFile) {
  postFile.addEventListener("change", () => {
    selectedPostFile = postFile.files?.[0] || null;

    if (!selectedPostFile) {
      postFileName.textContent = "Sin archivo";
      return;
    }

    // máximo recomendado (igual que tus comentarios)
    const maxMB = 50;
    const sizeMB = selectedPostFile.size / (1024 * 1024);

    if (sizeMB > maxMB) {
      alert(`El archivo es muy grande (${sizeMB.toFixed(1)}MB). Máximo recomendado: ${maxMB}MB.`);
      postFile.value = "";
      selectedPostFile = null;
      postFileName.textContent = "Sin archivo";
      return;
    }

    postFileName.textContent = selectedPostFile.name;
  });
}

if (postClearFile) {
  postClearFile.addEventListener("click", () => {
    if (postFile) postFile.value = "";
    selectedPostFile = null;
    if (postFileName) postFileName.textContent = "Sin archivo";
  });
}

function renderAttachment(att) {
  if (!att) return "";

  const safeName = escapeHTML(att.name || "archivo");

  if (att.type && att.type.startsWith("image/")) {
    return `<div class="attachment"><img src="${att.dataUrl}" alt="${safeName}"></div>`;
  }

  if (att.type && att.type.startsWith("video/")) {
    return `<div class="attachment"><video controls src="${att.dataUrl}"></video></div>`;
  }

  if (att.type === "application/pdf") {
    return `
      <div class="attachment">
        <a class="pdf-link" href="${att.dataUrl}" target="_blank" rel="noopener noreferrer">
          📄 ${safeName}
        </a>
      </div>
    `;
  }

  return `
    <div class="attachment">
      <a class="pdf-link" href="${att.dataUrl}" target="_blank" rel="noopener noreferrer">
        📎 ${safeName}
      </a>
    </div>
  `;
}

function buildPostHTML(p) {
  const isMine = p.user === currentUser;

  return `
  <article class="post" data-post-id="${escapeHTML(p.id)}">
    <div class="post-head">
      <div class="handle">${escapeHTML(p.user)}</div>

      ${isMine ? `
        <div class="post-actions-mini">
          <button class="icon-action edit-post" type="button" title="Editar publicación">✏️</button>
          <button class="icon-action del-post" type="button" title="Eliminar publicación">🗑️</button>
        </div>
      ` : ``}
    </div>

    <div class="post-box">
      <div class="placeholder">Publicación</div>
      <div class="desc post-text">${escapeHTML(p.text || "")}${p.edited ? " · editado" : ""}</div>
    </div>

    ${renderAttachment(p.attachment)}

    <div class="post-actions">
      <button class="icon-btn btn-comment" type="button" title="Comentar">💬</button>
      <button class="icon-btn btn-like" type="button" title="Me gusta" aria-pressed="false">♡</button>
    </div>

    <div class="comments">
      <div class="comment-title">Comentarios...</div>

      <ul class="comment-list"></ul>

      <form class="comment-form">
        <div class="comment-tools">
          <label class="attach-btn" title="Adjuntar archivo">
            📎 Adjuntar
            <input class="file-input" type="file" accept="image/*,video/*,application/pdf" hidden>
          </label>

          <span class="file-name">Sin archivo</span>

          <button class="clear-file" type="button" title="Quitar archivo">✖</button>
        </div>

        <input class="comment-input" type="text" placeholder="Escribe un comentario y presiona Enter..." />
      </form>
    </div>
  </article>
  `;
}

function setLikeUI(btn, liked) {
  btn.classList.toggle("liked", liked);
  btn.textContent = liked ? "♥" : "♡";
  btn.setAttribute("aria-pressed", String(liked));
}

function hasAttachment(postId, ts) {
  const arr = comments[postId] || [];
  const c = arr.find(x => x.ts === ts);
  return !!(c && c.attachment);
}

// Construir comentario (editar + eliminar solo del autor)
function buildCommentItem(postId, c) {
  const li = document.createElement("li");
  li.className = "comment";

  const d = new Date(c.ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  const left = document.createElement("div");
  left.className = "text";

  const attachmentHTML = renderAttachment(c.attachment);

  left.innerHTML = `
    <div>
      <span class="meta">${escapeHTML(c.user)} · ${hh}:${mm}${c.edited ? " · editado" : ""}</span>
      <span>${escapeHTML(c.text || "")}</span>
      ${attachmentHTML}
    </div>
  `;

  li.appendChild(left);

  if (c.user === currentUser) {
    const actions = document.createElement("div");
    actions.className = "comment-actions";

    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "icon-action edit-comment";
    edit.innerHTML = "✏️";
    edit.title = "Editar comentario";
    edit.dataset.ts = String(c.ts);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "icon-action del-comment";
    del.innerHTML = "🗑️";
    del.title = "Eliminar comentario";
    del.dataset.ts = String(c.ts);

    actions.appendChild(edit);
    actions.appendChild(del);
    li.appendChild(actions);
  }

  return li;
}

// Inicializar interacciones (like + comentarios) en un post ya renderizado
function initPost(post) {
  const postId = post.dataset.postId;

  // ===== LIKE =====
  const likeBtn = post.querySelector(".btn-like");
  setLikeUI(likeBtn, !!likes[postId]);

  likeBtn.addEventListener("click", () => {
    likes[postId] = !likes[postId];
    saveJSON("soyucab_likes", likes);
    setLikeUI(likeBtn, !!likes[postId]);
  });

  // ===== COMENTARIOS + ARCHIVOS =====
  const list = post.querySelector(".comment-list");
  const input = post.querySelector(".comment-input");
  const form = post.querySelector(".comment-form");
  const btnComment = post.querySelector(".btn-comment");

  const fileInput = post.querySelector(".file-input");
  const fileName = post.querySelector(".file-name");
  const clearFileBtn = post.querySelector(".clear-file");

  let selectedFile = null;

  btnComment.addEventListener("click", () => input.focus());

  fileInput.addEventListener("change", () => {
    selectedFile = fileInput.files?.[0] || null;

    if (!selectedFile) {
      fileName.textContent = "Sin archivo";
      return;
    }

    const maxMB = 50;
    const sizeMB = selectedFile.size / (1024 * 1024);

    if (sizeMB > maxMB) {
      alert(`El archivo es muy grande (${sizeMB.toFixed(1)}MB). Máximo recomendado: ${maxMB}MB.`);
      fileInput.value = "";
      selectedFile = null;
      fileName.textContent = "Sin archivo";
      return;
    }

    fileName.textContent = selectedFile.name;
  });

  clearFileBtn.addEventListener("click", () => {
    fileInput.value = "";
    selectedFile = null;
    fileName.textContent = "Sin archivo";
  });

  function renderComments() {
    list.innerHTML = "";
    (comments[postId] || []).forEach(c => {
      list.appendChild(buildCommentItem(postId, c));
    });
  }

  renderComments();

  // Enviar comentario
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const text = input.value.trim();
    if (!text && !selectedFile) return;

    let attachment = null;

    if (selectedFile) {
      const dataUrl = await fileToDataURL(selectedFile);
      attachment = { name: selectedFile.name, type: selectedFile.type, dataUrl };
    }

    const c = {
      user: currentUser,
      text,
      ts: Date.now(),
      attachment
    };

    comments[postId] = comments[postId] || [];
    comments[postId].unshift(c);
    saveJSON("soyucab_comments", comments);

    input.value = "";
    fileInput.value = "";
    selectedFile = null;
    fileName.textContent = "Sin archivo";

    renderComments();
  });

  // Delegación: eliminar/editar comentario
  list.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".del-comment");
    const editBtn = e.target.closest(".edit-comment");
    const saveBtn = e.target.closest(".save-edit");
    const cancelBtn = e.target.closest(".cancel-edit");

    if (delBtn) {
      const ts = Number(delBtn.dataset.ts);
      const arr = comments[postId] || [];
      const idx = arr.findIndex(x => x.ts === ts && x.user === currentUser);
      if (idx === -1) return;

      if (!confirm("¿Deseas eliminar este comentario?")) return;

      arr.splice(idx, 1);
      comments[postId] = arr;
      saveJSON("soyucab_comments", comments);
      renderComments();
      return;
    }

    if (editBtn) {
      const ts = Number(editBtn.dataset.ts);
      const li = editBtn.closest(".comment");
      if (!li) return;

      list.querySelectorAll(".edit-row").forEach(x => x.remove());

      const arr = comments[postId] || [];
      const c = arr.find(x => x.ts === ts && x.user === currentUser);
      if (!c) return;

      const editRow = document.createElement("div");
      editRow.className = "edit-row";
      editRow.innerHTML = `
        <input class="edit-input" type="text" value="${escapeHTML(c.text || "")}" />
        <button type="button" class="btn-mini btn-save save-edit" data-ts="${ts}">Guardar</button>
        <button type="button" class="btn-mini btn-cancel cancel-edit">Cancelar</button>
      `;

      li.querySelector(".text").appendChild(editRow);
      li.querySelector(".edit-input").focus();
      return;
    }

    if (saveBtn) {
      const ts = Number(saveBtn.dataset.ts);
      const li = saveBtn.closest(".comment");
      const newText = li.querySelector(".edit-input").value.trim();

      if (!newText && !hasAttachment(postId, ts)) {
        alert("El comentario no puede quedar vacío si no tiene archivo.");
        return;
      }

      const arr = comments[postId] || [];
      const idx = arr.findIndex(x => x.ts === ts && x.user === currentUser);
      if (idx === -1) return;

      arr[idx].text = newText;
      arr[idx].edited = true;
      saveJSON("soyucab_comments", comments);
      renderComments();
      return;
    }

    if (cancelBtn) {
      renderComments();
      return;
    }
  });

  // ===== CRUD Publicación (solo autor)
  const btnEditPost = post.querySelector(".edit-post");
  const btnDelPost = post.querySelector(".del-post");

  if (btnDelPost) {
    btnDelPost.addEventListener("click", () => {
      if (!confirm("¿Eliminar esta publicación?")) return;

      // borrar post
      posts = posts.filter(p => p.id !== postId);
      saveJSON(POSTS_KEY, posts);

      // borrar likes y comentarios asociados
      delete likes[postId];
      saveJSON("soyucab_likes", likes);

      delete comments[postId];
      saveJSON("soyucab_comments", comments);

      renderPosts();
    });
  }

  if (btnEditPost) {
  btnEditPost.addEventListener("click", () => {
        const p = posts.find(x => x.id === postId);
        if (!p || p.user !== currentUser) return;

        // Cierra cualquier editor abierto en ese post
        post.querySelectorAll(".post-edit-row").forEach(x => x.remove());

        const row = document.createElement("div");
        row.className = "post-edit-row";
        row.innerHTML = `
          <input class="post-edit-input" type="text" value="${escapeHTML(p.text || "")}">
          <button type="button" class="btn-mini btn-save">Guardar</button>
          <button type="button" class="btn-mini btn-cancel">Cancelar</button>
        `;

        // ✅ Insertar el editor DEBAJO de la caja del post (no dentro)
        const postBox = post.querySelector(".post-box");
        postBox.insertAdjacentElement("afterend", row);

        row.querySelector(".post-edit-input").focus();

        row.querySelector(".btn-cancel").addEventListener("click", () => {
          row.remove(); // no re-render, solo quitar editor
        });

        row.querySelector(".btn-save").addEventListener("click", () => {
          const newText = row.querySelector(".post-edit-input").value.trim();
          if (!newText && !p.attachment) {
            alert("La publicación no puede quedar vacía si no tiene archivo.");
            return;
          }

          posts = posts.map(x => {
            if (x.id !== postId) return x;
            return { ...x, text: newText, edited: true };
          });
          saveJSON(POSTS_KEY, posts);

          // ✅ re-render solo al final
          renderPosts();
        });
      });
    }
}

function renderPosts() {
  if (!postsMount) return;

  postsMount.innerHTML = posts
    .sort((a, b) => (b.ts || 0) - (a.ts || 0))
    .map(buildPostHTML)
    .join("");

  // inicializa likes/comentarios en cada post
  postsMount.querySelectorAll(".post").forEach(initPost);
}

// Crear publicación
if (postForm) {
  postForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    setPostError("");

    const text = (postInput?.value || "").trim();
    if (!text && !selectedPostFile) return;

    try {
      const resp = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: currentUser, contenido: text })
      });
      if (!resp.ok) throw new Error('Error creating post');
      await loadPosts(); // reload posts
    } catch (err) {
      setPostError("Error al publicar. Intenta de nuevo.");
      console.error(err);
      return;
    }

    // limpiar UI
    postInput.value = "";
    if (postFile) postFile.value = "";
    selectedPostFile = null;
    if (postFileName) postFileName.textContent = "Sin archivo";
  });
}

// ===== AVATAR SIDEBAR (tu lógica tal cual la tenías)
(function pintarAvatarSidebar(){
  try{
    const raw = localStorage.getItem("soyucab_profile");
    if(!raw) return;

    const profile = JSON.parse(raw);
    const avatarDataUrl = profile?.general?.avatarDataUrl || "";

    const img = document.getElementById("sidebarAvatarImg");
    const emoji = document.getElementById("sidebarAvatarEmoji");

    if(!img || !emoji) return;

    if(avatarDataUrl){
      img.src = avatarDataUrl;
      img.style.display = "block";
      emoji.style.display = "none";
    }else{
      img.removeAttribute("src");
      img.style.display = "none";
      emoji.style.display = "block";
    }
  }catch(e){
    console.warn("No se pudo cargar avatar del sidebar:", e);
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  try {
    const raw = localStorage.getItem("soyucab_profile");
    if (!raw) {
      console.warn("No existe soyucab_profile en localStorage.");
      return;
    }

    const profile = JSON.parse(raw);
    const avatarDataUrl = profile?.general?.avatarDataUrl || "";

    const img = document.getElementById("sidebarAvatarImg");
    const emoji = document.getElementById("sidebarAvatarEmoji");

    if (!img || !emoji) {
      console.warn("No encuentro sidebarAvatarImg o sidebarAvatarEmoji en el HTML.");
      return;
    }

    if (avatarDataUrl && avatarDataUrl.startsWith("data:image/")) {
      img.src = avatarDataUrl;
      img.style.display = "block";
      emoji.style.display = "none";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
      emoji.style.display = "block";
      console.warn("avatarDataUrl vacío o no es imagen.");
    }
  } catch (e) {
    console.warn("Error cargando avatar del sidebar:", e);
  }
});

const user = localStorage.getItem("soyucab_usuario") || "@usuario";
document.getElementById("sidebarUser") && (document.getElementById("sidebarUser").textContent = user);

// ===== AVATAR SIDEBAR =====
document.addEventListener("DOMContentLoaded", () => {
  try {
    const raw = localStorage.getItem("soyucab_profile");
    if (!raw) return;

    const profile = JSON.parse(raw);
    const avatarDataUrl = profile?.general?.avatarDataUrl || "";

    const img = document.getElementById("sidebarAvatarImg");
    const emoji = document.getElementById("sidebarAvatarEmoji");

    if (!img || !emoji) return;

    if (avatarDataUrl && avatarDataUrl.startsWith("data:image/")) {
      img.src = avatarDataUrl;
      img.style.display = "block";
      emoji.style.display = "none";
    } else {
      img.style.display = "none";
      emoji.style.display = "block";
    }
  } catch (e) {
    console.warn("Error cargando avatar:", e);
  }
});

// ✅ Load posts from DB
loadPosts();