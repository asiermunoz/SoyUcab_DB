const form = document.getElementById("formPersona");
const msg = document.getElementById("msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  // Validación simple
  const requiredIds = ["nombre","apellido","cedula","ciudad","pais","telefono","fecha","sexo","usuario","correo","contrasena"];
  for (const id of requiredIds) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      msg.textContent = "Por favor, completa todos los campos obligatorios.";
      msg.style.color = "#dc2626";
      el.focus();
      return;
    }
  }

  msg.textContent = "Registro enviado correctamente.";
  msg.style.color = "#16a34a";

  setTimeout(() => {
    alert("Registro de Persona exitoso.");
    window.location.href = "../index.html";
  }, 500);
});