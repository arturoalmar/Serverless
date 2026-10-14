const form = document.getElementById("signupForm");
const submitButton = document.getElementById("submitButton");
const formStatus = document.getElementById("formStatus");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  formStatus.textContent = "";
  formStatus.removeAttribute("data-state");

  const apiUrl = window.FESTIVAL_API_URL?.trim();
  if (!apiUrl) {
    showStatus("El formulario estará disponible cuando se conecte la API del festival.", "error");
    return;
  }

  const payload = {
    name: form.elements.name.value.trim(),
    email: form.elements.email.value.trim()
  };

  submitButton.disabled = true;
  submitButton.firstElementChild.textContent = "Enviando…";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "No se pudo completar la inscripción.");

    form.reset();
    showStatus("¡Gracias! Ya estás en la lista. Nos vemos en la sala.", "success");
  } catch (error) {
    showStatus(error.message || "No pudimos conectar con el festival. Prueba de nuevo.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.firstElementChild.textContent = "Quiero recibir novedades";
  }
});

function showStatus(message, state) {
  formStatus.textContent = message;
  formStatus.dataset.state = state;
}