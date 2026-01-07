// ✅ Proteger: si NO hay sesión, volver al login
if (!localStorage.getItem("soyucab_sesion")) {
  window.location.href = "../login/index.html";
}

// Logout
document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("soyucab_sesion");
  window.location.href = "../login/index.html";
});

const msg = document.getElementById("msg");
const btnEdit = document.getElementById("btnEdit");
const btnSave = document.getElementById("btnSave");

const displayUser = document.getElementById("displayUser");
const displayRole = document.getElementById("displayRole");
const roleTitle = document.getElementById("roleTitle");
const roleFields = document.getElementById("roleFields");
const form = document.getElementById("perfilForm");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const contrasenaPerfil = document.getElementById("contrasenaPerfil");
const verContrasenaPerfil = document.getElementById("verContrasenaPerfil");

if (verContrasenaPerfil && contrasenaPerfil) {
  verContrasenaPerfil.addEventListener("change", () => {
    contrasenaPerfil.type = verContrasenaPerfil.checked ? "text" : "password";
  });
}


// Avatar
const avatarImg = document.getElementById("avatarImg");
const avatarEmoji = document.getElementById("avatarEmoji");
const avatarInput = document.getElementById("avatarInput");
const btnRemoveAvatar = document.getElementById("btnRemoveAvatar");

// Rol
const role = (localStorage.getItem("soyucab_role") || "persona").toLowerCase();
const currentUser = localStorage.getItem("soyucab_usuario") || "@usuario";

// Perfil base
const profile = loadJSON("soyucab_profile", {
  role,
  general: {
    usuario: currentUser,
    correo: "",
    pais: "",
    ciudad: "",
    avatarDataUrl: ""
  },
  persona: {
    nombre: "",
    apellido: "",
    bio: "",
    cedula: "",
    fechaNacimiento: "",
    sexo: "",
    telefono: "",
    tipoPersona: "",

    // Estudiante
    carrera: "",
    semestre: "",
    poseeCarnet: false,
    carnetName: "",
    carnetDataUrl: "",

    // Profesor
    escuela: "",
    materias: "",
    poseeCarnetProfesor: false,
    carnetProfesorName: "",
    carnetProfesorDataUrl: "",

    // ✅ Administrativo / Obrero
    poseeCarnetStaff: false,
    carnetStaffName: "",
    carnetStaffDataUrl: ""
  },

  dependencia: {
      nombre: "",
      abreviatura: "",
      tipo: ""
  },
  organizacion: {
      nombre: "",
      rif: "",
      sector: "",
      descripcion:"",
      miembros: ""
  }
});

profile.role = role;
profile.general.usuario ||= currentUser;

// Render inicial
renderHeader();
renderGeneral();
renderRoleFields();
renderAvatar();
setEditable(false);

// ================= BOTONES =================
btnEdit.addEventListener("click", () => {
  msg.textContent = "";
  msg.style.color = "";
  setEditable(true);
});

btnSave.addEventListener("click", () => {
  msg.textContent = "";
  msg.style.color = "";

  // Generales
  profile.general.usuario = getValue("usuario");
  profile.general.correo = getValue("correo");

  // ✅ Dependencia: NO guardar País/Ciudad
    if (role === "dependencia") {
      profile.general.pais = "";
      profile.general.ciudad = "";
    } else {
      profile.general.pais = getValue("pais");
      profile.general.ciudad = getValue("ciudad");
    }

  if (role === "persona") {
    profile.persona.nombre = getValue("p_nombre");
    profile.persona.apellido = getValue("p_apellido");
    profile.general.bio = getValue("bio");
    profile.persona.cedula = getValue("p_cedula");
    profile.persona.telefono = getValue("p_telefono");
    profile.persona.fechaNacimiento = getValue("p_fecha");
    profile.persona.sexo = getValue("p_sexo");
    profile.persona.tipoPersona = getValue("p_tipoPersona");

    const tipo = profile.persona.tipoPersona;

    // === Estudiante ===
    if (tipo === "estudiante") {
      profile.persona.carrera = getValue("p_carrera");

      const semRaw = getValue("p_semestre");
      const sem = Number(semRaw);
      if (!Number.isInteger(sem) || sem < 1 || sem > 8) {
        msg.textContent = "El semestre debe ser un número entre 1 y 8.";
        msg.style.color = "#dc2626";
        return;
      }
      profile.persona.semestre = String(sem);

      const chk = document.getElementById("p_poseeCarnet");
      profile.persona.poseeCarnet = !!(chk && chk.checked);
      if (!profile.persona.poseeCarnet) {
        profile.persona.carnetName = "";
        profile.persona.carnetDataUrl = "";
      }

      // limpiar otros carnets
      profile.persona.escuela = "";
      profile.persona.materias = "";
      profile.persona.poseeCarnetProfesor = false;
      profile.persona.carnetProfesorName = "";
      profile.persona.carnetProfesorDataUrl = "";

      profile.persona.poseeCarnetStaff = false;
      profile.persona.carnetStaffName = "";
      profile.persona.carnetStaffDataUrl = "";
    }

    // === Profesor ===
    if (tipo === "profesor") {
      profile.persona.escuela = getValue("p_escuela");
      profile.persona.materias = getValue("p_materias");

      const chkP = document.getElementById("p_poseeCarnetProfesor");
      profile.persona.poseeCarnetProfesor = !!(chkP && chkP.checked);
      if (!profile.persona.poseeCarnetProfesor) {
        profile.persona.carnetProfesorName = "";
        profile.persona.carnetProfesorDataUrl = "";
      }

      // limpiar estudiante y staff
      profile.persona.carrera = "";
      profile.persona.semestre = "";
      profile.persona.poseeCarnet = false;
      profile.persona.carnetName = "";
      profile.persona.carnetDataUrl = "";

      profile.persona.poseeCarnetStaff = false;
      profile.persona.carnetStaffName = "";
      profile.persona.carnetStaffDataUrl = "";
    }

    // === Administrativo / Obrero ===
    if (tipo === "administrativo" || tipo === "obrero") {
      const chkS = document.getElementById("p_poseeCarnetStaff");
      profile.persona.poseeCarnetStaff = !!(chkS && chkS.checked);
      if (!profile.persona.poseeCarnetStaff) {
        profile.persona.carnetStaffName = "";
        profile.persona.carnetStaffDataUrl = "";
      }

      // limpiar estudiante y profesor
      profile.persona.carrera = "";
      profile.persona.semestre = "";
      profile.persona.poseeCarnet = false;
      profile.persona.carnetName = "";
      profile.persona.carnetDataUrl = "";

      profile.persona.escuela = "";
      profile.persona.materias = "";
      profile.persona.poseeCarnetProfesor = false;
      profile.persona.carnetProfesorName = "";
      profile.persona.carnetProfesorDataUrl = "";
    }
  }

  if (role === "dependencia") {
      profile.dependencia = profile.dependencia || {};
      profile.dependencia.nombre = getValue("d_nombre");
      profile.dependencia.abreviatura = getValue("d_abreviatura");
      profile.dependencia.tipo = getValue("d_tipo");
  }

  if (role === "organizacion") {
      profile.organizacion = profile.organizacion || {};
      profile.organizacion.nombre = getValue("o_nombre");
      profile.organizacion.rif = getValue("o_rif");
      profile.organizacion.sector = getValue("o_sector");
      profile.organizacion.descripcion = getValue("o_descripcion");
      profile.organizacion.miembros = getValue("o_miembros");
  }

  // ====== ACTUALIZAR CONTRASEÑA EN soyucab_users ======
  const newPass = getValue("password");
    if (newPass) {
        const currentHandle = (localStorage.getItem("soyucab_usuario") || "@usuario").replace("@", "").toLowerCase();
        const users = loadJSON("soyucab_users", []);

        const idx = users.findIndex(u => String(u.usuario || "").toLowerCase() === currentHandle);
        if (idx >= 0) {
          users[idx].contrasena = newPass;
          saveJSON("soyucab_users", users);
        }
    }


  saveJSON("soyucab_profile", profile);

  msg.textContent = "Perfil guardado correctamente.";
  msg.style.color = "#16a34a";
  setEditable(false);
});

// ================= AVATAR =================
avatarInput.addEventListener("change", async () => {
  const file = avatarInput.files && avatarInput.files[0];
  if (!file) return;

  if (!validateFileSize(file, 2)) return;

  const dataUrl = await fileToDataURL(file);
  profile.general.avatarDataUrl = dataUrl;
  saveJSON("soyucab_profile", profile);
  renderAvatar();
});

btnRemoveAvatar.addEventListener("click", () => {
  profile.general.avatarDataUrl = "";
  saveJSON("soyucab_profile", profile);
  renderAvatar();
});

function renderAvatar() {
  const has = !!profile.general.avatarDataUrl;
  if (has) {
    avatarImg.src = profile.general.avatarDataUrl;
    avatarImg.style.display = "block";
    avatarEmoji.style.display = "none";
  } else {
    avatarImg.removeAttribute("src");
    avatarImg.style.display = "none";
    avatarEmoji.style.display = "block";
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
  //Contraseña
  const currentHandle = (localStorage.getItem("soyucab_usuario") || "@usuario").replace("@", "").toLowerCase();
  const users = loadJSON("soyucab_users", []);

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

  //Contraseña
  const found = users.find(u => String(u.usuario || "").toLowerCase() === currentHandle);

  if (passwordInput) {
    passwordInput.value = found ? (found.contrasena || "") : "";
  }

  // Si el checkbox existe, por defecto ocultar
  if (togglePassword) {
    togglePassword.checked = false;
    if (passwordInput) passwordInput.type = "password";
  }

  if (togglePassword && passwordInput) {
  togglePassword.addEventListener("change", () => {
    passwordInput.type = togglePassword.checked ? "text" : "password";
  });
  }
}

function renderRoleFields() {
  roleFields.innerHTML = "";

   if (role === "dependencia") {
  const tipo = profile.dependencia?.tipo || "";

  roleFields.innerHTML = `
    <div class="grid-2">
      <div class="field">
        <label>Nombre de la dependencia</label>
        <input id="d_nombre" value="${escapeHTML(profile.dependencia?.nombre || "")}" disabled>
      </div>
      <div class="field">
        <label>Abreviatura</label>
        <input id="d_abreviatura" value="${escapeHTML(profile.dependencia?.abreviatura || "")}" disabled>
      </div>
    </div>

    <div class="field">
      <label for="d_tipo">Tipo</label>
      <select id="d_tipo" disabled>
        <option value="" ${!tipo ? "selected" : ""} disabled>Selecciona</option>
        <option value="academica" ${tipo === "academica" ? "selected" : ""}>Académica</option>
        <option value="administrativa" ${tipo === "administrativa" ? "selected" : ""}>Administrativa</option>
        <option value="servicios" ${tipo === "servicios" ? "selected" : ""}>Servicios</option>
        <option value="otra" ${tipo === "otra" ? "selected" : ""}>Otra</option>
      </select>
    </div>
  `;
  return; // 🔴 importante
}

if (role === "organizacion") {
  const sector = profile.organizacion?.sector || "";

  roleFields.innerHTML = `
    <div class="grid-2">
      <div class="field">
        <label>Nombre de la organización</label>
        <input id="o_nombre" value="${escapeHTML(profile.organizacion?.nombre || "")}" disabled>
      </div>
      <div class="field">
        <label>RIF</label>
        <input id="o_rif" value="${escapeHTML(profile.organizacion?.rif || "")}" disabled>
      </div>
    </div>

    <div class="field">
      <label for="o_sector">Sector</label>
      <select id="o_sector" disabled>
        <option value="" ${!sector ? "selected" : ""} disabled>Selecciona</option>
        <option value="educacion" ${sector === "educacion" ? "selected" : ""}>Educación</option>
        <option value="salud" ${sector === "salud" ? "selected" : ""}>Salud</option>
        <option value="tecnologia" ${sector === "tecnologia" ? "selected" : ""}>Tecnología</option>
        <option value="finanzas" ${sector === "finanzas" ? "selected" : ""}>Finanzas</option>
        <option value="ong" ${sector === "ong" ? "selected" : ""}>ONG</option>
        <option value="otro" ${sector === "otro" ? "selected" : ""}>Otro</option>
      </select>
    </div>

    <div class="field">
      <label>Descripción</label>
      <textarea id="o_descripcion" rows="4" disabled>${escapeHTML(profile.organizacion?.descripcion || "")}</textarea>
    </div>

    <div class="field">
        <label for="o_miembros">Cantidad de miembros</label>
        <input
          type="number"
          id="o_miembros"
          min="1"
          placeholder="Ej: 25"
          value="${profile.organizacion?.miembros || ""}"
          disabled >
    </div>
  `;
  return;
}


  const tipo = profile.persona.tipoPersona;
  roleFields.innerHTML = `
    <div class="grid-2">
      <div class="field">
        <label>Nombre</label>
        <input id="p_nombre" value="${escapeHTML(profile.persona.nombre)}" disabled>
      </div>
      <div class="field">
        <label>Apellido</label>
        <input id="p_apellido" value="${escapeHTML(profile.persona.apellido)}" disabled>
      </div>
    </div>

    <div class="grid-2">
      <div class="field">
        <label>Cédula</label>
        <input id="p_cedula" value="${escapeHTML(profile.persona.cedula)}" disabled>
      </div>
      <div class="field">
        <label>Teléfono</label>
        <input id="p_telefono" value="${escapeHTML(profile.persona.telefono)}" disabled>
      </div>
    </div>

    <div class="grid-2">
      <div class="field">
        <label>Tipo de persona</label>
        <select id="p_tipoPersona" disabled>
          <option value="">Selecciona</option>
          <option value="estudiante" ${tipo==="estudiante"?"selected":""}>Estudiante</option>
          <option value="profesor" ${tipo==="profesor"?"selected":""}>Profesor</option>
          <option value="administrativo" ${tipo==="administrativo"?"selected":""}>Personal administrativo</option>
          <option value="obrero" ${tipo==="obrero"?"selected":""}>Personal obrero</option>
        </select>
      </div>

      <div class="field">
        <label>Fecha de nacimiento</label>
        <input id="p_fecha" type="date" value="${escapeHTML(profile.persona.fechaNacimiento)}" disabled>
      </div>
    </div>

    <div class="grid-2">
      <div class="field">
        <label>Sexo</label>
        <select id="p_sexo" disabled>
          <option value="">Selecciona</option>
          <option value="f" ${profile.persona.sexo==="f"?"selected":""}>Femenino</option>
          <option value="m" ${profile.persona.sexo==="m"?"selected":""}>Masculino</option>
        </select>
      </div>
    </div>

    ${tipo === "estudiante" ? renderCarnetBlock("Carnet del estudiante", "p_poseeCarnet", "p_carnet", profile.persona.poseeCarnet, profile.persona.carnetName, profile.persona.carnetDataUrl, true) : ""}
    ${tipo === "profesor" ? renderProfessorBlock() : ""}
    ${(tipo === "administrativo" || tipo === "obrero") ? renderCarnetBlock("Carnet (Administrativo/Obrero)", "p_poseeCarnetStaff", "p_carnetStaff", profile.persona.poseeCarnetStaff, profile.persona.carnetStaffName, profile.persona.carnetStaffDataUrl, false) : ""}
  `;

  const tipoSelect = document.getElementById("p_tipoPersona");
  tipoSelect.addEventListener("change", () => {
    syncPersonaInputsToProfile();
    profile.persona.tipoPersona = tipoSelect.value;
    renderRoleFields();
    setEditable(!btnSave.disabled);
  });

  hookCarnet("p_poseeCarnet", "carnetBox_p_carnet", "file_p_carnet", "name_p_carnet", "clear_p_carnet",
    "estudiante");

  hookCarnet("p_poseeCarnetStaff", "carnetBox_p_carnetStaff", "file_p_carnetStaff", "name_p_carnetStaff", "clear_p_carnetStaff",
    "staff");

  hookProfessorCarnetListeners();
}

function renderProfessorBlock() {
  const preview = renderAttachmentPreview(profile.persona.carnetProfesorDataUrl, profile.persona.carnetProfesorName);

  return `
    <hr class="sep">
    <h3 class="section-title">Datos del profesor</h3>

    <div class="field">
      <label>Escuela a la que pertenece</label>
      <input id="p_escuela" value="${escapeHTML(profile.persona.escuela)}" disabled>
    </div>

    <div class="field">
      <label>Materias que dicta</label>
      <textarea id="p_materias" rows="4" disabled>${escapeHTML(profile.persona.materias)}</textarea>
    </div>

    ${renderCarnetBlock("Carnet del profesor", "p_poseeCarnetProfesor", "p_carnetProfesor",
      profile.persona.poseeCarnetProfesor, profile.persona.carnetProfesorName, profile.persona.carnetProfesorDataUrl, false)}

    ${preview ? preview : ""}
  `;
}

function renderCarnetBlock(title, chkId, key, checked, fileName, dataUrl, includeAcademics) {
  const has = !!checked;
  const safeName = fileName ? escapeHTML(fileName) : "Sin archivo";
  const preview = renderAttachmentPreview(dataUrl, fileName);

  return `
    <hr class="sep">
    <h3 class="section-title">${title}</h3>

    ${includeAcademics ? `
    <div class="grid-2">
      <div class="field">
        <label>Carrera</label>
        <input id="p_carrera" value="${escapeHTML(profile.persona.carrera)}" disabled>
      </div>
      <div class="field">
        <label>Semestre (1 al 8)</label>
        <input id="p_semestre" type="number" min="1" max="8" value="${escapeHTML(profile.persona.semestre)}" disabled>
      </div>
    </div>` : ""}

    <div class="field">
      <label class="inline-check">
        <input id="${chkId}" type="checkbox" ${has ? "checked" : ""} disabled>
        ¿Posee carnet?
      </label>
    </div>

    <div id="carnetBox_${key}" class="field" style="${has ? "" : "display:none;"}">
      <label>Archivo del carnet (Imagen o PDF)</label>

      <div class="file-row">
        <label class="file-btn">
          📎 Subir
          <input id="file_${key}" type="file" accept="image/*,application/pdf" hidden disabled>
        </label>

        <span id="name_${key}" class="file-name">${safeName}</span>
        <button id="clear_${key}" class="btn" type="button" disabled>Quitar</button>
      </div>

      ${preview}
    </div>
  `;
}

function hookCarnet(chkId, boxId, fileId, nameId, clearId, mode) {
  const chk = document.getElementById(chkId);
  const box = document.getElementById(boxId);
  const file = document.getElementById(fileId);
  const clear = document.getElementById(clearId);

  if (!chk || !box) return;

  chk.addEventListener("change", () => {
    const on = chk.checked;

    if (mode === "estudiante") profile.persona.poseeCarnet = on;
    if (mode === "staff") profile.persona.poseeCarnetStaff = on;

    if (!on) {
      if (mode === "estudiante") { profile.persona.carnetName=""; profile.persona.carnetDataUrl=""; }
      if (mode === "staff") { profile.persona.carnetStaffName=""; profile.persona.carnetStaffDataUrl=""; }
    }

    renderRoleFields();
    setEditable(!btnSave.disabled);
  });

  if (file) {
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      if (!validateFileSize(f, 3)) return;

      const dataUrl = await fileToDataURL(f);

      if (mode === "estudiante") { profile.persona.carnetName=f.name; profile.persona.carnetDataUrl=dataUrl; }
      if (mode === "staff") { profile.persona.carnetStaffName=f.name; profile.persona.carnetStaffDataUrl=dataUrl; }

      renderRoleFields();
      setEditable(!btnSave.disabled);
    });
  }

  if (clear) {
    clear.addEventListener("click", () => {
      if (mode === "estudiante") { profile.persona.carnetName=""; profile.persona.carnetDataUrl=""; }
      if (mode === "staff") { profile.persona.carnetStaffName=""; profile.persona.carnetStaffDataUrl=""; }
      renderRoleFields();
      setEditable(!btnSave.disabled);
    });
  }
}

function hookProfessorCarnetListeners() {
  const chk = document.getElementById("p_poseeCarnetProfesor");
  const box = document.getElementById("carnetBox_p_carnetProfesor");
  const file = document.getElementById("file_p_carnetProfesor");
  const clear = document.getElementById("clear_p_carnetProfesor");

  if (!chk || !box) return;

  chk.addEventListener("change", () => {
    profile.persona.poseeCarnetProfesor = chk.checked;
    if (!chk.checked) {
      profile.persona.carnetProfesorName = "";
      profile.persona.carnetProfesorDataUrl = "";
    }
    renderRoleFields();
    setEditable(!btnSave.disabled);
  });

  if (file) {
    file.addEventListener("change", async () => {
      const f = file.files && file.files[0];
      if (!f) return;
      if (!validateFileSize(f, 3)) return;

      const dataUrl = await fileToDataURL(f);
      profile.persona.carnetProfesorName = f.name;
      profile.persona.carnetProfesorDataUrl = dataUrl;

      renderRoleFields();
      setEditable(!btnSave.disabled);
    });
  }

  if (clear) {
    clear.addEventListener("click", () => {
      profile.persona.carnetProfesorName = "";
      profile.persona.carnetProfesorDataUrl = "";
      renderRoleFields();
      setEditable(!btnSave.disabled);
    });
  }
}

// Preview imagen / pdf
function renderAttachmentPreview(dataUrl, name) {
  if (!dataUrl) return "";
  const safeName = escapeHTML(name || "carnet");

  if (String(dataUrl).startsWith("data:application/pdf")) {
    return `
      <div class="carnet-preview">
        <a class="pdf-link" href="${dataUrl}" target="_blank" rel="noopener noreferrer">📄 ${safeName}</a>
      </div>
    `;
  }

  if (String(dataUrl).startsWith("data:image/")) {
    return `
      <div class="carnet-preview">
        <img src="${dataUrl}" alt="${safeName}">
      </div>
    `;
  }

  return `
    <div class="carnet-preview">
      <a class="pdf-link" href="${dataUrl}" target="_blank" rel="noopener noreferrer">📎 ${safeName}</a>
    </div>
  `;
}

function validateFileSize(file, maxMB) {
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxMB) {
    alert(`El archivo es muy grande (${sizeMB.toFixed(1)}MB). Máximo recomendado: ${maxMB}MB.`);
    return false;
  }
  return true;
}

function syncPersonaInputsToProfile() {
  const map = (id, fn) => {
    const el = document.getElementById(id);
    if (el) fn(el.value);
  };
  map("p_nombre", v => profile.persona.nombre = v.trim());
  map("p_apellido", v => profile.persona.apellido = v.trim());
  map("p_cedula", v => profile.persona.cedula = v.trim());
  map("p_telefono", v => profile.persona.telefono = v.trim());
  map("p_fecha", v => profile.persona.fechaNacimiento = v.trim());
  map("p_sexo", v => profile.persona.sexo = v.trim());
  map("p_carrera", v => profile.persona.carrera = v.trim());
  map("p_semestre", v => profile.persona.semestre = v.trim());
  map("p_escuela", v => profile.persona.escuela = v.trim());
  map("p_materias", v => profile.persona.materias = v.trim());
}

// ================= EDITABLE =================
function setEditable(enabled) {
  form.querySelectorAll("input, textarea, select, button").forEach(el => {
    if (el.id === "btnLogout" || el.id === "btnEdit" || el.id === "btnSave" || el.id === "togglePassword") return;
    el.disabled = !enabled;
});

  avatarInput.disabled = !enabled;
  btnRemoveAvatar.disabled = !enabled;

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
function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function escapeHTML(str="") {
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}