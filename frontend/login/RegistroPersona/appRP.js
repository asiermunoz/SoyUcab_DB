const form = document.getElementById("formPersona");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Validación simple
  const requiredIds = ["nombre","apellido","cedula","ciudad","pais","fecha","sexo","usuario","correo","contrasena"];
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
    nombre: document.getElementById("nombre").value.trim(),
    apellido: document.getElementById("apellido").value.trim(),
    cedula: document.getElementById("cedula").value.trim(),
    ciudad: document.getElementById("ciudad").value.trim(),
    pais: document.getElementById("pais").value.trim(),
    fecha: document.getElementById("fecha").value,
    sexo: document.getElementById("sexo").value,
    bio: document.getElementById("bio").value.trim(),
    usuario: document.getElementById("usuario").value.trim(),
    correo: document.getElementById("correo").value.trim(),
    contrasena: document.getElementById("contrasena").value
  };

  // Capitalizar ciudad y pais
  data.ciudad = data.ciudad.charAt(0).toUpperCase() + data.ciudad.slice(1).toLowerCase();
  data.pais = data.pais.charAt(0).toUpperCase() + data.pais.slice(1).toLowerCase();

  try {
    const resp = await fetch('/api/register/persona', {
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