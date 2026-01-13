// ✅ Proteger: si NO hay sesión, volver al login
const token = localStorage.getItem("soyucab_token");
if (!token) {
  window.location.href = "../login/index.html";
}

// Logout
document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("soyucab_token");
  localStorage.removeItem("soyucab_usuario");
  localStorage.removeItem("soyucab_role");
  window.location.href = "../login/index.html";
});

// Elementos del DOM
const msg = document.getElementById("msg");
const btnEdit = document.getElementById("btnEdit");
const btnSave = document.getElementById("btnSave");
const btnDelete = document.getElementById("btnDelete");
const displayUser = document.getElementById("displayUser");
const displayRole = document.getElementById("displayRole");
const roleTitle = document.getElementById("roleTitle");
const roleFields = document.getElementById("roleFields");
const form = document.getElementById("perfilForm");
const passwordInput = document.getElementById("contrasenaPerfil");
const togglePassword = document.getElementById("verContrasenaPerfil");

// Event listeners para botones
btnEdit.addEventListener("click", () => setEditable(true));
btnSave.addEventListener("click", saveProfile);
btnDelete.addEventListener("click", deleteProfile);

// Event listener para toggle password
if (togglePassword && passwordInput) {
  togglePassword.addEventListener("change", () => {
    passwordInput.type = togglePassword.checked ? "text" : "password";
  });
}

// Rol y usuario actual
const role = (localStorage.getItem("soyucab_role") || "persona").toLowerCase();
const currentUser = localStorage.getItem("soyucab_usuario") || "@usuario";

// Perfil base (solo campos de DB)
const profile = {
  role,
  general: {
    usuario: currentUser,
    correo: "",
    pais: "",
    ciudad: "",
    password: ""
  },
  persona: {
    nombre: "",
    apellido: "",
    cedula: "",
    fechaNacimiento: "",
    sexo: "",
    bio: ""
  },
  dependencia: {
    nombre: "",
    abreviatura: "",
    tipo: ""
  },
  organizacion: {
    nombre: "",
    rif: "",
    descripcion: "",
    sector: "",
    miembros: ""
  }
};

// ================= FUNCIONES DE API =================

// Cargar perfil desde API
async function loadProfile() {
  try {
    const resp = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (resp.ok) {
      const data = await resp.json();
      // Actualizar profile con datos de API
      profile.role = data.role;
      profile.general = { ...profile.general, ...data.general };
      if (data.persona) profile.persona = { ...profile.persona, ...data.persona };
      if (data.dependencia) profile.dependencia = { ...profile.dependencia, ...data.dependencia };
      if (data.organizacion) profile.organizacion = { ...profile.organizacion, ...data.organizacion };
    } else {
      const data = await resp.json();
      throw new Error(data.error || 'Error al cargar perfil');
    }
  } catch (err) {
    console.error('Error cargando perfil:', err);
    msg.textContent = err.message;
    msg.style.color = '#dc2626';
  }
}

// Guardar perfil en API
async function saveProfile() {
  // Recopilar datos del formulario
  profile.general.correo = getValue("correo");
  profile.general.pais = role !== "dependencia" ? getValue("pais") : "";
  profile.general.ciudad = role !== "dependencia" ? getValue("ciudad") : "";
  profile.general.password = getValue("contrasenaPerfil");

  if (role === "persona") {
    profile.persona.nombre = getValue("p_nombre");
    profile.persona.apellido = getValue("p_apellido");
    profile.persona.fechaNacimiento = getValue("p_fecha");
    profile.persona.sexo = getValue("p_sexo");
    profile.general.bio = getValue("bio");
  } else if (role === "dependencia") {
    profile.dependencia.nombre = getValue("d_nombre");
    profile.dependencia.tipo = getValue("d_tipo");
  } else if (role === "organizacion") {
    profile.organizacion.nombre = getValue("o_nombre");
    profile.organizacion.descripcion = getValue("o_descripcion");
    profile.organizacion.sector = getValue("o_sector");
    profile.organizacion.miembros = getValue("o_miembros");
  }

  try {
    const resp = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profile)
    });
    if (resp.ok) {
      msg.textContent = "Perfil actualizado correctamente.";
      msg.style.color = "#16a34a";
      setEditable(false);
    } else {
      const data = await resp.json();
      throw new Error(data.error || 'Error al actualizar perfil');
    }
  } catch (err) {
    console.error('Error guardando perfil:', err);
    msg.textContent = err.message;
    msg.style.color = '#dc2626';
  }
}

// Eliminar perfil
async function deleteProfile() {
  if (!confirm("¿Estás seguro de que quieres eliminar tu perfil? Esta acción no se puede deshacer.")) return;

  try {
    const resp = await fetch('/api/profile', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (resp.ok) {
      alert("Perfil eliminado correctamente.");
      localStorage.clear();
      window.location.href = "../login/index.html";
    } else {
      const data = await resp.json();
      throw new Error(data.error || 'Error al eliminar perfil');
    }
  } catch (err) {
    console.error('Error eliminando perfil:', err);
    msg.textContent = err.message;
    msg.style.color = '#dc2626';
  }
}

// ================= RENDER =================
function renderHeader() {
  displayUser.textContent = profile.general.usuario || currentUser;

  if (role === "dependencia") {
    displayRole.textContent = "Dependencia UCAB";
    roleTitle.textContent = "Datos de Dependencia";
    return;
  }

  if (role === "organizacion") {
    displayRole.textContent = "Organización Asociada";
    roleTitle.textContent = "Datos de Organización";
    return;
  }

  displayRole.textContent = "Persona";
  roleTitle.textContent = "Datos de Persona";
}

function renderGeneral() {
  setValue("usuario", profile.general.usuario);
  setValue("correo", profile.general.correo);

  const bioField = document.getElementById("bio");
  const paisEl = document.getElementById("pais");
  const ciudadEl = document.getElementById("ciudad");

  // ✅ Dependencia: NO mostrar País/Ciudad
  const hideLocation = (role === "dependencia");

  if (paisEl) {
    paisEl.value = hideLocation ? "" : (profile.general.pais || "");
    const box = paisEl.closest(".field");
    if (box) box.style.display = hideLocation ? "none" : "";
  }

  if (ciudadEl) {
    ciudadEl.value = hideLocation ? "" : (profile.general.ciudad || "");
    const box = ciudadEl.closest(".field");
    if (box) box.style.display = hideLocation ? "none" : "";
  }

  // ✅ SOLO PERSONA TIENE BIOGRAFÍA
  if (role === "persona") {
    bioField.value = profile.general.bio || "";
    bioField.closest(".field").style.display = "flex";
  } else {
    bioField.value = "";
    bioField.closest(".field").style.display = "none";
  }

  // Contraseña: dejar vacío
  if (passwordInput) {
    passwordInput.value = "";
  }

  // Si el checkbox existe, por defecto ocultar
  if (togglePassword) {
    togglePassword.checked = false;
    if (passwordInput) passwordInput.type = "password";
  }
}

function renderRoleFields() {
  roleFields.innerHTML = "";

  if (role === "dependencia") {
    roleFields.innerHTML = `
      <div class="grid-2">
        <div class="field">
          <label>Nombre de la dependencia</label>
          <input id="d_nombre" value="${escapeHTML(profile.dependencia.nombre || "")}" disabled>
        </div>
        <div class="field">
          <label>Abreviatura</label>
          <input id="d_abreviatura" value="${escapeHTML(profile.dependencia.abreviatura || "")}" disabled>
        </div>
      </div>
      <div class="field">
        <label for="d_tipo">Tipo</label>
        <select id="d_tipo" disabled>
          <option value="Facultad" ${profile.dependencia.tipo === "Facultad" ? "selected" : ""}>Facultad</option>
          <option value="Escuela" ${profile.dependencia.tipo === "Escuela" ? "selected" : ""}>Escuela</option>
          <option value="Direccion" ${profile.dependencia.tipo === "Direccion" ? "selected" : ""}>Dirección</option>
          <option value="Centro" ${profile.dependencia.tipo === "Centro" ? "selected" : ""}>Centro</option>
        </select>
      </div>
    `;
  } else if (role === "organizacion") {
    roleFields.innerHTML = `
      <div class="grid-2">
        <div class="field">
          <label>Nombre de la organización</label>
          <input id="o_nombre" value="${escapeHTML(profile.organizacion.nombre || "")}" disabled>
        </div>
        <div class="field">
          <label>RIF</label>
          <input id="o_rif" value="${escapeHTML(profile.organizacion.rif || "")}" disabled>
        </div>
      </div>
      <div class="field">
        <label for="o_sector">Sector</label>
        <select id="o_sector" disabled>
          <option value="">Selecciona</option>
          <option value="educacion" ${profile.organizacion.sector === "educacion" ? "selected" : ""}>Educación</option>
          <option value="salud" ${profile.organizacion.sector === "salud" ? "selected" : ""}>Salud</option>
          <option value="tecnologia" ${profile.organizacion.sector === "tecnologia" ? "selected" : ""}>Tecnología</option>
          <option value="finanzas" ${profile.organizacion.sector === "finanzas" ? "selected" : ""}>Finanzas</option>
          <option value="ong" ${profile.organizacion.sector === "ong" ? "selected" : ""}>ONG</option>
          <option value="otro" ${profile.organizacion.sector === "otro" ? "selected" : ""}>Otro</option>
        </select>
      </div>
      <div class="field">
        <label>Descripción</label>
        <textarea id="o_descripcion" rows="4" disabled>${escapeHTML(profile.organizacion.descripcion || "")}</textarea>
      </div>
      <div class="field">
        <label for="o_miembros">Cantidad de miembros</label>
        <input type="number" id="o_miembros" min="1" value="${profile.organizacion.miembros || ""}" disabled>
      </div>
    `;
  } else { // persona
    roleFields.innerHTML = `
      <div class="grid-2">
        <div class="field">
          <label>Nombre</label>
          <input id="p_nombre" value="${escapeHTML(profile.persona.nombre || "")}" disabled>
        </div>
        <div class="field">
          <label>Apellido</label>
          <input id="p_apellido" value="${escapeHTML(profile.persona.apellido || "")}" disabled>
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label>Cédula</label>
          <input id="p_cedula" value="${escapeHTML(profile.persona.cedula || "")}" disabled>
        </div>
        <div class="field">
          <label>Fecha de nacimiento</label>
          <input id="p_fecha" type="date" value="${escapeHTML(profile.persona.fechaNacimiento || "")}" disabled>
        </div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label>Sexo</label>
          <select id="p_sexo" disabled>
            <option value="">Selecciona</option>
            <option value="f" ${profile.persona.sexo === "f" ? "selected" : ""}>Femenino</option>
            <option value="m" ${profile.persona.sexo === "m" ? "selected" : ""}>Masculino</option>
          </select>
        </div>
      </div>
    `;
  }
}



function setEditable(enabled) {
  form.querySelectorAll("input, textarea, select").forEach(el => {
    if (el.id === "usuario" || el.id === "p_cedula" || el.id === "d_abreviatura" || el.id === "o_rif") return; // No editables
    el.disabled = !enabled;
  });
  btnSave.disabled = !enabled;
  btnEdit.disabled = enabled;
}

function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function setValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value || "";
}

function escapeHTML(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ================= INICIALIZACIÓN =================

(async () => {
  await loadProfile();
  renderHeader();
  renderGeneral();
  renderRoleFields();
  setEditable(false);
})();