const form = document.getElementById("formDependencia");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
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

  // Prepare data
  const data = {
    abreviatura: document.getElementById("abreviatura").value.trim(),
    nombre: document.getElementById("nombre").value.trim(),
    tipo: document.getElementById("tipo").value,
    usuario: document.getElementById("usuario").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    contrasena: document.getElementById("contrasena").value
  };

  try {
    const resp = await fetch('/api/register/dependencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await resp.json();

    if (resp.ok) {
      msg.textContent = result.message || "Registro exitoso.";
      msg.style.color = "#16a34a";
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 1000);
    } else {
      msg.textContent = result.error || "Error en el registro.";
      msg.style.color = "#dc2626";
    }
  } catch (err) {
    console.error('Error:', err);
    msg.textContent = "Error de conexión.";
    msg.style.color = "#dc2626";
  }
});