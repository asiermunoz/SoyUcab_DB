const form = document.getElementById("formOrg");
const msg = document.getElementById("msg");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const requiredIds = ["nombre","rif","ciudad","pais","sector","miembros","usuario","correo","contrasena"];
  for (const id of requiredIds) {
    const el = document.getElementById(id);
    if (!el.value.trim()) {
      msg.textContent = "Por favor, completa todos los campos obligatorios.";
      msg.style.color = "#dc2626";
      el.focus();
      return;
    }
  }

  // Validación simple para miembros (>= 1)
  const miembros = Number(document.getElementById("miembros").value);
  if (!Number.isFinite(miembros) || miembros < 1) {
    msg.textContent = "El campo 'Miembros' debe ser un número mayor o igual a 1.";
    msg.style.color = "#dc2626";
    document.getElementById("miembros").focus();
    return;
  }

  msg.textContent = "Registro de Organización enviado.";
  msg.style.color = "#16a34a";

  setTimeout(() => {
    alert("Registro exitoso.");
    window.location.href = "../index.html";
  }, 500);
});