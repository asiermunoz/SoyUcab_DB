function $(id){ return document.getElementById(id); }

function loadJSON(key, fallback){
  try{
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  }catch{
    return fallback;
  }
}

/* ==========================
   PROTECCIÓN: solo admin
   ========================== */
(function guard(){
  const role = localStorage.getItem("soyucab_role");
  const user = localStorage.getItem("soyucab_usuario");
  if (!user || role !== "admin"){
    // Si no es admin, vuelve a inicio (o login si no hay sesión)
    window.location.href = user ? "../Inicio/inicio.html" : "../login/index.html";
  }
})();

/* ==========================
   LECTURA (ajustada a tu app)
   - Usuarios: intenta varias llaves
   - Grupos/Eventos/Posts: intenta llaves comunes
   ========================== */
function readUsers(){
  const keys = ["soyucab_users","soyucab_usuarios","usuarios","users","app_users"];
  let out = [];
  keys.forEach(k => {
    const data = loadJSON(k, null);
    if (Array.isArray(data)) out = out.concat(data);
  });

  // si existen perfiles tipo diccionario: { "@user": {general:{...}} }
  const profKeys = ["soyucab_profiles","profiles","perfil_data"];
  profKeys.forEach(k => {
    const data = loadJSON(k, null);
    if (data && typeof data === "object" && !Array.isArray(data)){
      Object.keys(data).forEach(u => out.push({ username: u, ...(data[u]||{}) }));
    }
  });

  // normalizar a username/displayName si se puede
  return out.map(u => ({
    username: u.username || u.user || u.handle || u.usuario || u.email || "",
    displayName: u.displayName || u.name || u.nombre || u.fullName || u.username || "",
    role: u.role || u.tipo || u.rol || u.userType || "persona"
  })).filter(u => u.username);
}

function readGroups(){
  const keys = ["soyucab_groups","groups","grupos","app_groups"];
  for (const k of keys){
    const data = loadJSON(k, null);
    if (Array.isArray(data)) return data;
  }
  return [];
}

function readEvents(){
  const keys = ["soyucab_events","events","eventos","app_events"];
  for (const k of keys){
    const data = loadJSON(k, null);
    if (Array.isArray(data)) return data;
  }
  return [];
}

function readPosts(){
  const keys = ["soyucab_posts","posts","publicaciones","app_posts"];
  for (const k of keys){
    const data = loadJSON(k, null);
    if (Array.isArray(data)) return data;
  }
  return [];
}

/* ==========================
   Render métricas + listas
   ========================== */
function render(){
  const users = readUsers();
  const groups = readGroups();
  const events = readEvents();
  const posts = readPosts();

  const mUsers = $("mUsers");
  const mGroups = $("mGroups");
  const mEvents = $("mEvents");
  const mPosts = $("mPosts");

  if (mUsers) mUsers.textContent = users.length;
  if (mGroups) mGroups.textContent = groups.length;
  if (mEvents) mEvents.textContent = events.length;
  if (mPosts) mPosts.textContent = posts.length;

  renderLastUsers(users);
  renderLastGroups(groups);
}

function renderLastUsers(users){
  const box = $("lastUsers");
  const empty = $("lastUsersEmpty");
  if (!box || !empty) return;

  box.innerHTML = "";

  const last = users.slice(-6).reverse();
  if (last.length === 0){
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  last.forEach(u => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <strong>${u.displayName || u.username}</strong><br/>
        <small>${u.username}</small>
      </div>
      <small>${u.role}</small>
    `;
    box.appendChild(div);
  });
}

function renderLastGroups(groups){
  const box = $("lastGroups");
  const empty = $("lastGroupsEmpty");
  if (!box || !empty) return;

  box.innerHTML = "";

  const last = groups.slice(-6).reverse();
  if (last.length === 0){
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  last.forEach(g => {
    const name = g.nombre || g.name || "Grupo";
    const type = g.tipo || g.type || "—";
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <div>
        <strong>${name}</strong><br/>
        <small>${type}</small>
      </div>
      <small>${g.estado || g.status || ""}</small>
    `;
    box.appendChild(div);
  });
}

/* ==========================
   Acciones
   ========================== */
const btnGoInicio = $("btnGoInicio");
const btnLogout = $("btnLogout");

if (btnGoInicio){
  btnGoInicio.addEventListener("click", () => {
    window.location.href = "../Inicio/inicio.html";
  });
}

if (btnLogout){
  btnLogout.addEventListener("click", () => {
    // Ajusta a tus llaves reales de sesión si usas otras
    localStorage.removeItem("soyucab_usuario");
    localStorage.removeItem("soyucab_role");
    localStorage.removeItem("soyucab_sesion");
    window.location.href = "../login/index.html";
  });
}

const goUsuarios = document.getElementById("goUsuarios");
if (goUsuarios) {
  goUsuarios.addEventListener("click", () => {
    window.location.href = "GestionUsuario/gestionUsuario.html";
  });
}

const goGrupos = document.getElementById("goGrupos");
if (goGrupos) {
  goGrupos.addEventListener("click", () => {
    window.location.href = "GestionGrupo/gestionGrupo.html";
  });
}

const goEventos = document.getElementById("goEventos");
if (goEventos) {
  goEventos.addEventListener("click", () => {
    window.location.href = "GestionEvento/gestionEvento.html";
  });
}

const goPosts = document.getElementById("goPosts");
if (goPosts) {
  goPosts.addEventListener("click", () => {
    window.location.href = "GestionPublicaciones/gestionPublicacion.html";
  });
}

/* =========================
   REPORTES (Tarjetas - Vista general)
   ========================= */
(function initReportCards(){
  const grid = document.getElementById("reportsGrid");
  if (!grid) return;

  // ✅ Los 9 reportes.
  const reports = [
    { id: "r1_total_usuarios", title: "Numero Total de Usuarios Registrados", icon: "👤" },
    { id: "r2_egresados_carrera_anio", title: "Numero de Egresados por Carrera y por Año de Graduacion", icon: "🎓" },
    { id: "r3_total_grupos", title: "Cantidad Total de Grupos Creados", icon: "👥" },
    { id: "r4_grupos_mayor_miembros", title: "Grupos con Mayor Numero de Miembros Activos", icon: "🏆" },
    { id: "r5_eventos_mayor_asistencia", title: "Eventos con mayor asistencia registrada", icon: "📅" },
    { id: "r6_eventos_por_mes", title: "Numero de Eventos Organizados por Mes", icon: "🗓️" },
    { id: "r7_usuarios_activos_mes", title: "Usuarios Activos por Mes", icon: "📈" },
    { id: "r8_ranking_usuarios_publicaciones", title: "Ranking de Usuarios Mas Activos en Publicaciones", icon: "🔥" },
    { id: "r9_publicaciones_mas_comentadas", title: "Publicaciones Mas Comentadas", icon: "💬" }
  ];

  // Render tarjetas
  grid.innerHTML = reports.map(r => `
    <div class="reportCard">
      <div class="reportLeft">
        <div class="reportIcon" aria-hidden="true">${r.icon}</div>
        <div class="reportText" style="min-width:0;">
          <p class="reportTitle">${r.title}</p>
        </div>
      </div>

      <button class="reportBtn" type="button"
        title="Descargar PDF"
        data-report="${r.id}"
        data-title="${r.title}">
        📄
      </button>
    </div>
  `).join("");

  // ✅ Listener DIRECTO por botón (evita que algo del contenedor/navegación cancele el fetch)
  grid.querySelectorAll(".reportBtn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const reportId = btn.getAttribute("data-report");
      const reportTitle = btn.getAttribute("data-title") || reportId;

      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "⏳";

      try{
        await downloadReportPdf(reportId, reportTitle);
      }finally{
        btn.disabled = false;
        btn.textContent = oldText;
      }
    });
  });

  async function downloadReportPdf(reportId, reportTitle){
    const JSREPORT_URL = "http://127.0.0.1:5488/api/report";

    try{
      const payload = {
        template: { name: reportId }
        // data: {}  // 👈 luego metemos data real
      };

      const res = await fetch(JSREPORT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        mode: "cors",
        cache: "no-store",
        keepalive: true
      });

      if (!res.ok){
        const txt = await res.text().catch(() => "");
        throw new Error(`JSReport respondió ${res.status}. ${txt}`);
      }

      const blob = await res.blob();
      const filename = makeFileName(reportTitle);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

    }catch(err){
      console.error("❌ Error generando reporte:", err);

      // Mensaje más claro
      alert(
        "No se pudo generar el PDF.\n\n" +
        "1) Confirma que el template exista en JSReport: " + reportId + "\n" +
        "2) Abre la consola del navegador (F12) y revisa el error.\n\n" +
        "Detalle: " + (err && err.message ? err.message : err)
      );
    }
  }

  function makeFileName(title){
    const safe = String(title || "reporte")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 _-]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .toLowerCase();

    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,"0");
    const dd = String(d.getDate()).padStart(2,"0");

    return `${safe}_${yyyy}-${mm}-${dd}.pdf`;
  }
})();

render();