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
   Acciones
   ========================== */
const btnLogout = $("btnLogout");

if (btnLogout){
  btnLogout.addEventListener("click", () => {
    // Ajusta a tus llaves reales de sesión si usas otras
    localStorage.removeItem("soyucab_usuario");
    localStorage.removeItem("soyucab_role");
    localStorage.removeItem("soyucab_sesion");
    window.location.href = "../login/index.html";
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
      // Obtener data del backend
      const token = localStorage.getItem("soyucab_token");
      const dataRes = await fetch(`http://localhost:3000/api/report-data/${reportId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!dataRes.ok) throw new Error("No se pudo obtener data del reporte");
      const reportData = await dataRes.json();

      const payload = {
        template: { name: reportId },
        data: reportData
      };

      const res = await fetch(JSREPORT_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
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
