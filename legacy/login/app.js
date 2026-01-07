// ======================
// Navegación de pantallas
// ======================
const vistaLogin = document.getElementById("vista-login");
const vistaRegistro = document.getElementById("vista-registro");

const btnIrRegistro = document.getElementById("btnIrRegistro");
const btnVolverLogin = document.getElementById("btnVolverLogin");

function mostrarRegistro() {
  vistaLogin.classList.add("oculto");
  vistaRegistro.classList.remove("oculto");
}

function mostrarLogin() {
  vistaRegistro.classList.add("oculto");
  vistaLogin.classList.remove("oculto");
}

if (btnIrRegistro) btnIrRegistro.addEventListener("click", mostrarRegistro);
if (btnVolverLogin) btnVolverLogin.addEventListener("click", mostrarLogin);

// ======================
// Helpers de storage
// ======================
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

// ======================
// ✅ Crear usuarios base (seed)
// ======================
// Esto crea 3 usuarios iniciales:
// 1) demo / demo123 (persona)
// 2) dep.ucab@ucab.edu.ve / dep123 (dependencia)
// 3) org.asociada@correo.com / org123 (organizacion)
function initUsuariosBase() {
  const existentes = loadJSON("soyucab_users", null);
  if (existentes && Array.isArray(existentes) && existentes.length > 0) return;

  const base = [
    {
      usuario: "demo",
      correo: "demo@correo.com",
      contrasena: "demo123",
      role: "persona"
    },
    {
      usuario: "dep.ucab",
      correo: "dep.ucab@ucab.edu.ve",
      contrasena: "dep123",
      role: "dependencia"
    },
    {
      usuario: "org.asociada",
      correo: "org.asociada@correo.com",
      contrasena: "org123",
      role: "organizacion"
    },
    {
      usuario: "admin",
      correo: "admin@ucab.edu.ve",
      contrasena: "admin123",
      role: "admin"
    }
  ];

  saveJSON("soyucab_users", base);
}

initUsuariosBase();

// ======================
// Lógica del LOGIN
// ======================
const formulario = document.getElementById("formulario-login");
const usuario = document.getElementById("usuario");
const contrasena = document.getElementById("contrasena");
const recordar = document.getElementById("recordar");
const mensaje = document.getElementById("mensaje");
const olvido = document.getElementById("olvido");

// Si ya hay sesión, manda al inicio
if (localStorage.getItem("soyucab_sesion")) {
  window.location.href = "../Inicio/inicio.html";
}

// Cargar usuario guardado
if (localStorage.getItem("usuario")) {
  usuario.value = localStorage.getItem("usuario");
  recordar.checked = true;
}

// Olvidé contraseña
if (olvido) {
  olvido.addEventListener("click", function (e) {
    e.preventDefault();
    if (usuario.value.trim() === "") {
      mensaje.textContent = "Ingresa tu correo o usuario para recuperar tu contraseña.";
      mensaje.style.color = "red";
    } else {
      mensaje.textContent = "Te enviamos instrucciones de recuperación.";
      mensaje.style.color = "green";
    }
  });
}

// Normaliza para comparar usuario/correo sin fallos
function norm(str) {
  return String(str || "").trim().toLowerCase();
}

// Devuelve @handle
function buildHandle(u) {
  // si ya viene con @, lo respeta; si no, lo agrega
  const base = (u || "").trim();
  if (!base) return "@usuario";
  return base.startsWith("@") ? base : ("@" + base);
}

// Buscar usuario por "usuario" o por "correo"
function findUser(loginInput, passInput) {
  const users = loadJSON("soyucab_users", []);
  const u = norm(loginInput);
  const p = String(passInput || "");

  return users.find(x => {
    const uMatch = norm(x.usuario) === u || norm(x.correo) === u;
    const pMatch = String(x.contrasena) === p;
    return uMatch && pMatch;
  });
}

// ======================
// ✅ Crear usuarios base (una vez)
// ======================
(function initUsuariosBase() {
  const users = JSON.parse(localStorage.getItem("soyucab_users")) || [];

  const exists = (u) => users.some(x => x.usuario === u);

  if (!exists("demo")) {
    users.push({ usuario: "demo", correo: "demo@correo.com", contrasena: "demo123", role: "persona" });
  }
  if (!exists("dep.ucab")) {
    users.push({ usuario: "dep.ucab", correo: "dep.ucab@ucab.edu.ve", contrasena: "dep123", role: "dependencia" });
  }
  if (!exists("org.asociada")) {
    users.push({ usuario: "org.asociada", correo: "org.asociada@correo.com", contrasena: "org123", role: "organizacion" });
  }
  if (!exists("admin")) {
  users.push({ usuario: "admin", correo: "admin@ucab.edu.ve", contrasena: "admin123", role: "admin" });
  }

  localStorage.setItem("soyucab_users", JSON.stringify(users));
})();

// Enviar formulario
if (formulario) {
  formulario.addEventListener("submit", function (e) {
    e.preventDefault();

    if (usuario.value.trim() === "" || contrasena.value === "") {
      mensaje.textContent = "Por favor, completa todos los campos.";
      mensaje.style.color = "red";
      return;
    }

    if (recordar.checked) {
      localStorage.setItem("usuario", usuario.value.trim());
    } else {
      localStorage.removeItem("usuario");
    }

    // ✅ Login real con los 3 usuarios (demo + dependencia + organizacion)
    const found = findUser(usuario.value, contrasena.value);

    if (found) {
      // ✅ Guardar sesión
      localStorage.setItem("soyucab_sesion", "1");

      // ✅ Guardar usuario (handle) y rol
      localStorage.setItem("soyucab_usuario", buildHandle(found.usuario));
      localStorage.setItem("soyucab_role", found.role);

      mensaje.textContent = "Inicio de sesión exitoso.";
      mensaje.style.color = "green";

      // ✅ Redirigir al inicio
      setTimeout(() => {
          if (found.role === "admin") {
            window.location.href = "../Admin/admin.html";
          } else {
            window.location.href = "../Inicio/inicio.html";
          }
        }, 300);

      return;
    }

    // Si no coincide, mostrar error
    mensaje.textContent = "Usuario o contraseña incorrectos.";
    mensaje.style.color = "red";
  });
}

// ======================
// Registro: selección de tipo
// ======================
const opciones = document.querySelectorAll(".opcion");
const btnRegistrarFinal = document.getElementById("btnRegistrarFinal");
const mensajeRegistro = document.getElementById("mensajeRegistro");

// 👇 OJO: en tu HTML NO existe btnContinuarRegistro, por eso antes se caía el JS
const btnContinuarRegistro = document.getElementById("btnContinuarRegistro");

let seleccion = "";

function setActiva(btn) {
  opciones.forEach(b => {
    const activa = (b === btn);
    b.classList.toggle("activa", activa);
    b.setAttribute("aria-pressed", String(activa));
  });
  seleccion = btn.dataset.value;
  if (mensajeRegistro) {
    mensajeRegistro.textContent = "";
    mensajeRegistro.style.color = "#334155";
  }
}

// 👉 CLICK EN LOS BOTONES DE REGISTRO
opciones.forEach(btn => {
  btn.addEventListener("click", () => {
    setActiva(btn);

    // ✅ Persona
    if (btn.dataset.value === "persona") {
      window.location.href = "RegistroPersona/registro-persona.html";
    }

    // ✅ Dependencia UCAB
    if (btn.dataset.value === "dependencia") {
      window.location.href = "RegistroDependencia/registro-dependencia-ucab.html";
    }

    // ✅ Organización Asociada
    if (btn.dataset.value === "organizacion") {
      window.location.href = "RegistroOrganizacion/registro-organizacion.html";
    }
  });
});

// ✅ btnContinuarRegistro 
if (btnContinuarRegistro) {
  btnContinuarRegistro.addEventListener("click", () => {
    if (seleccion === "persona") {
      window.location.href = "RegistroPersona/registro-persona.html";
      return;
    }

    if (seleccion === "dependencia") {
      window.location.href = "RegistroDependencia/registro-dependencia-ucab.html";
      return;
    }

    if (seleccion === "organizacion") {
      window.location.href = "RegistroOrganizacion/registro-organizacion.html";
      return;
    }

    alert("Opción no válida.");
  });
}

// btnRegistrarFinal está disabled.
if (btnRegistrarFinal) {
}