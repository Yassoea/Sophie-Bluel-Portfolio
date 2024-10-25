const loginApi = "http://localhost:5678/api/users/login";

document.getElementById("loginform").addEventListener("submit", handleSubmit);

async function handleSubmit(event) {
  event.preventDefault(); 

  // Réinitialiser les messages d'erreur avant de soumettre le formulaire
  const existingError = document.querySelector(".error-login");
  if (existingError) {
    existingError.remove(); // Retirer tout message d'erreur précédent
  }

  let user = {
    email: document.getElementById("email").value,
    password: document.getElementById("password").value,
  };

  let response = await fetch(loginApi, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  });

  if (response.status !== 200) {
    // Créer un message d'erreur
    const errorBox = document.createElement("div");
    errorBox.className = "error-login";
    errorBox.textContent = "Veuillez vérifier votre email et/ou votre mot de passe"; // Utiliser textContent pour éviter les failles XSS
    errorBox.style.color = "red"; // Mettre le texte en rouge
    document.querySelector("form").prepend(errorBox);
  } else {
    let result = await response.json();
    const token = result.token;
    sessionStorage.setItem("authToken", token);
    window.location.href = "index.html";
  }
}
