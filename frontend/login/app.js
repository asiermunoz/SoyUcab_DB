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

btnIrRegistro.addEventListener("click", mostrarRegistro);
btnVolverLogin.addEventListener("click", mostrarLogin);

// ======================
// Lógica del LOGIN
// ======================
const formulario = document.getElementById("formulario-login");
const usuario = document.getElementById("usuario");
const contrasena = document.getElementById("contrasena");
const recordar = document.getElementById("recordar");
const mensaje = document.getElementById("mensaje");
const olvido = document.getElementById("olvido");

// Cargar usuario guardado
if (localStorage.getItem("usuario")) {
  usuario.value = localStorage.getItem("usuario");
  recordar.checked = true;
}

// Olvidé contraseña
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

// Enviar formulario (ahora envía al backend)
formulario.addEventListener("submit", async function (e) {
  e.preventDefault();

  mensaje.textContent = "";

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

  try {
    const resp = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usuario.value.trim(), password: contrasena.value })
    });

    const data = await resp.json();

    if (resp.ok) {
      mensaje.textContent = data.message || 'Inicio de sesión exitoso.';
      mensaje.style.color = 'green';
      // Guardar token y sesión
      localStorage.setItem("soyucab_token", data.token);
      localStorage.setItem("soyucab_usuario", data.user.username);
      localStorage.setItem("soyucab_role", data.user.role);
      // Redirigir a la página principal
      setTimeout(() => window.location.href = '../Inicio/inicio.html', 400);
    } else {
      mensaje.textContent = data.error || 'Usuario o contraseña incorrectos.';
      mensaje.style.color = 'red';
    }
  } catch (err) {
    console.error('Error al conectar con el backend:', err);
    mensaje.textContent = 'Error de conexión. Intenta más tarde.';
    mensaje.style.color = 'red';
  }
});

// ======================
// Registro: selección de tipo
// ======================
const opciones = document.querySelectorAll(".opcion");
const btnContinuarRegistro = document.getElementById("btnContinuarRegistro");
const btnRegistrarFinal = document.getElementById("btnRegistrarFinal");
const mensajeRegistro = document.getElementById("mensajeRegistro");

let seleccion = "";  

function setActiva(btn) {
  opciones.forEach(b => {
    const activa = (b === btn);
    b.classList.toggle("activa", activa);
    b.setAttribute("aria-pressed", String(activa));
  });
  seleccion = btn.dataset.value;
  mensajeRegistro.textContent = "";
  mensajeRegistro.style.color = "#334155";
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