const form = document.getElementById("formDependencia");
const msg = document.getElementById("msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const requiredIds = ["abreviatura","nombre","tipo","usuario","correo","contrasena"];
  for (const id of requiredIds) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      msg.textContent = "Por favor, completa todos los campos obligatorios.";
      msg.style.color = "#dc2626";
      el.focus();
      return;
    }
  }

  msg.textContent = "Registro de Dependencia UCAB enviado.";
  msg.style.color = "#16a34a";

  setTimeout(() => {
    alert("Registro exitoso.");
    window.location.href = "../index.html";
  }, 500);
});