const url = "http://localhost:5678/api";

// Initialisation
getWorks();
getCategories();
displayAdminMode();
handlePictureSubmit();

// Fonction pour récupérer et afficher les travaux
async function getWorks(filter) {
  document.querySelector(".gallery").innerHTML = "";
  document.querySelector(".modal-gallery").innerHTML = "";

  try {
    const response = await fetch(`${url}/works`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const json = await response.json();
    const works = filter ? json.filter(data => data.categoryId === filter) : json;

    // Ajout des travaux dans la galerie
    works.forEach(work => setFigure(work));

    // Ajout des événements de suppression pour chaque icône de poubelle
    const trashCans = document.querySelectorAll(".delete-button");
    trashCans.forEach(button =>
      button.addEventListener("click", (event) => deleteWork(event, button.dataset.id))
    );

    console.log("Les travaux sont récupérés :", json);
  } catch (error) {
    console.error(error.message);
  }
}

// Fonction pour ajouter les figures (images + titre) dans les galeries
function setFigure(data) {
  // Galerie principale
  const figure = document.createElement("figure");
  figure.innerHTML = `<img src=${data.imageUrl} alt=${data.title}>
                      <figcaption>${data.title}</figcaption>`;
  document.querySelector(".gallery").append(figure);

  // Galerie dans la modale
  const modalFigure = document.createElement("figure");
  modalFigure.innerHTML = `
    <div class="image-container">
      <img src=${data.imageUrl} alt=${data.title}>
      <button class="delete-button" data-id="${data.id}">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
    <figcaption>${data.title}</figcaption>
  `;
  document.querySelector(".modal-gallery").append(modalFigure);
}

// Gestion des filtres
async function getCategories() {
  try {
    const response = await fetch(`${url}/categories`);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const categories = await response.json();
    categories.forEach(category => setFilter(category));
  } catch (error) {
    console.error(error.message);
  }
}

function setFilter(data) {
  const div = document.createElement("div");
  div.className = data.id;
  div.textContent = data.name;

  div.addEventListener("click", () => {
    getWorks(data.id);
    toggleFilter(div);
  });

  document.querySelector(".div-container").append(div);
}

// Activation du filtre visuellement
function toggleFilter(element) {
  const container = document.querySelector(".div-container");
  Array.from(container.children).forEach(child => child.classList.remove("active-filter"));
  element.classList.add("active-filter");
}

// Mode administrateur
function displayAdminMode() {
  if (sessionStorage.authToken) {
    const editBanner = document.createElement("div");
    editBanner.className = "edit"; 
    editBanner.innerHTML = '<p><a href="#modal1" class="js-modal"><i class="fa-regular fa-pen-to-square"></i>Mode édition</a></p>';
    document.body.prepend(editBanner);

    document.querySelector(".log-button").textContent = "logout";
    document.querySelector(".log-button").addEventListener("click", () => {
      sessionStorage.removeItem("authToken");
    });
  }
}

// Ouverture et fermeture de la modale
let modal = null;
let focusables = [];
const focusableSelector = "button, a, input, textarea";

const openModal = function (e) {
  e.preventDefault();
  modal = document.querySelector(e.target.getAttribute("href"));
  focusables = Array.from(modal.querySelectorAll(focusableSelector));
  focusables[0].focus();
  modal.style.display = null;
  modal.removeAttribute("aria-hidden");
  modal.setAttribute("aria-modal", "true");
  modal.addEventListener("click", closeModal);

  modal.querySelectorAll(".js-modal-close").forEach(btn => btn.addEventListener("click", closeModal));
  modal.querySelector(".js-modal-stop").addEventListener("click", stopPropagation);
};

const closeModal = function (e) {
  if (!modal) return;
  e.preventDefault();
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
  modal.removeAttribute("aria-modal");
  modal = null;
};

const stopPropagation = function (e) {
  e.stopPropagation();
};

document.querySelectorAll(".js-modal").forEach(a => a.addEventListener("click", openModal));

// Fonction de suppression des travaux
async function deleteWork(event, workId) {
  event.stopPropagation();
  const token = sessionStorage.authToken;

  if (!token) {
    console.error("Token d'authentification manquant.");
    return;
  }

  try {
    const response = await fetch(`${url}/works/${workId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 204) {
      console.log(`Travail avec l'ID ${workId} supprimé`);
      getWorks();  // Rafraîchir la galerie après suppression
    } else {
      throw new Error("Erreur lors de la suppression");
    }
  } catch (error) {
    console.error("Erreur lors de la suppression :", error);
  }
}

// Gestion de l'ajout d'une nouvelle photo
function handlePictureSubmit() {
  const fileInput = document.getElementById("file");
  const titleInput = document.getElementById("title");
  const categorySelect = document.getElementById("category");

  let file;
  fileInput.addEventListener("change", function (event) {
    file = event.target.files[0];
    const maxFileSize = 4 * 1024 * 1024;

    if (file && (file.type === "image/jpeg" || file.type === "image/png")) {
      if (file.size > maxFileSize) {
        alert("La taille de l'image ne doit pas dépasser 4 Mo.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.src = e.target.result;
        img.alt = "Uploaded Photo";
        document.getElementById("photo-container").appendChild(img);
      };
      reader.readAsDataURL(file);
    } else {
      alert("Veuillez sélectionner une image au format JPG ou PNG.");
    }
  });

  const addPictureForm = document.getElementById("picture-form");
  addPictureForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (file && titleInput.value) {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("title", titleInput.value);
      formData.append("category", categorySelect.value);

      const token = sessionStorage.authToken;
      if (!token) {
        console.error("Token d'authentification manquant.");
        return;
      }

      try {
        const response = await fetch(`${url}/works`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.status === 201) {
          console.log("Nouveau travail ajouté");
          getWorks(); // Rafraîchir la galerie
        } else {
          const errorText = await response.text();
          console.error("Erreur lors de l'ajout :", errorText);
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout :", error);
      }
    } else {
      alert("Veuillez remplir tous les champs.");
    }
  });
}
