const url = "http://localhost:5678/api";

// Initialisation
getWorks();
getCategories();
displayAdminMode();
handlePictureSubmit();

// Toggle entre les deux modales
const addPhotoButton = document.querySelector(".add-photo-button");
const backButton = document.querySelector(".js-modal-back");
addPhotoButton.addEventListener("click", toggleModal);
backButton.addEventListener("click", toggleModal);


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
  const img = document.createElement("img");
  img.src = data.imageUrl; // Assurez-vous que l'URL de l'image est correcte
  img.alt = data.title;

  const figcaption = document.createElement("figcaption");
  figcaption.textContent = data.title; // Utilisation de textContent pour éviter les failles XSS

  figure.appendChild(img);
  figure.appendChild(figcaption);
  document.querySelector(".gallery").appendChild(figure);

  // Galerie dans la modale
  const modalFigure = document.createElement("figure");
  const imageContainer = document.createElement("div");
  imageContainer.className = "image-container";

  const modalImg = document.createElement("img");
  modalImg.src = data.imageUrl; // Assurez-vous que l'URL de l'image est correcte
  modalImg.alt = data.title;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.dataset.id = data.id;
  deleteButton.innerHTML = '<i class="fa-solid fa-trash-can"></i>'; // On peut utiliser innerHTML ici car ce n'est pas une donnée utilisateur

  imageContainer.appendChild(modalImg);
  imageContainer.appendChild(deleteButton);

  const modalFigcaption = document.createElement("figcaption");
  modalFigcaption.textContent = data.title; // Utilisation de textContent pour éviter les failles XSS

  modalFigure.appendChild(imageContainer);
  modalFigure.appendChild(modalFigcaption);
  
  document.querySelector(".modal-gallery").appendChild(modalFigure);
}


// Gestion des filtres
async function getCategories() {
    try {
        const response = await fetch(`${url}/categories`);
        if (!response.ok) {
            throw new Error(`Response status: ${response.status}`);
        }

        const categories = await response.json();

        // Ajoutez le filtre "Tous" avant d'ajouter les catégories
        const allFilter = document.getElementById("all");
        allFilter.addEventListener("click", () => {
            getWorks(null); // Passer null pour récupérer tous les travaux
            toggleFilter(allFilter); // Activer visuellement le filtre "Tous"
        });

        // Ajoutez les filtres de catégories
        categories.forEach(category => setFilter(category));
    } catch (error) {
        console.error(error.message);
    }
}

function setFilter(data) {
    const div = document.createElement("div");
    div.className = "filter"; // Assurez-vous d'ajouter une classe pour le style
    div.textContent = data.name;

    div.addEventListener("click", () => {
        getWorks(data.id); // Appliquer le filtre par catégorie
        toggleFilter(div); // Activer le filtre visuellement
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
  const editButton = document.querySelector(".js-modal-2"); // Sélectionne le bouton "modifier"
  
  if (sessionStorage.authToken) {
    const editBanner = document.createElement("div");
    editBanner.className = "edit"; 
    editBanner.innerHTML = '<p><a href="#modal1" class="js-modal"><i class="fa-regular fa-pen-to-square"></i>Mode édition</a></p>';
    document.body.prepend(editBanner);

    document.querySelector(".log-button").textContent = "logout";
    document.querySelector(".log-button").addEventListener("click", () => {
      sessionStorage.removeItem("authToken");
      displayAdminMode(); // Réactualiser l'affichage après déconnexion
    });

    editButton.style.display = "block"; // Affiche le bouton si l'utilisateur est connecté
  } else {
    editButton.style.display = "none"; // Cache le bouton si l'utilisateur n'est pas connecté
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
  if (e) e.preventDefault();
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
// Toggle entre les 2 modales
function toggleModal() {
  const galleryModal = document.querySelector(".gallery-modal");
  const addModal = document.querySelector(".add-modal");

  if (
    galleryModal.style.display === "block" ||
    galleryModal.style.display === ""
  ) {
    galleryModal.style.display = "none";
    addModal.style.display = "block";
  } else {
    galleryModal.style.display = "block";
    addModal.style.display = "none";
  }
}
// Gestion de l'ajout d'une nouvelle photo
function handlePictureSubmit() {
  const img = document.createElement("img");
  const fileInput = document.getElementById("file");
  let file; // On ajoutera dans cette variable la photo qui a été uploadée.
  fileInput.style.display = "none";
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
        img.src = e.target.result;
        img.alt = "Uploaded Photo";
        document.getElementById("photo-container").appendChild(img);
      };
      // Je converti l'image en une URL de donnees
      reader.readAsDataURL(file);
      document
        .querySelectorAll(".picture-loaded") // Pour enlever ce qui se trouvait avant d'upload l'image
        .forEach((e) => (e.style.display = "none"));
    } else {
      alert("Veuillez sélectionner une image au format JPG ou PNG.");
    }
  });

  const titleInput = document.getElementById("title");
  let titleValue = "";
  let selectedValue = "1";

  document.getElementById("category").addEventListener("change", function () {
    selectedValue = this.value;
  });

  titleInput.addEventListener("input", function () {
    titleValue = titleInput.value;
  });

  const addPictureForm = document.getElementById("picture-form");

  addPictureForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const hasImage = document.querySelector("#photo-container").firstChild;
    if (hasImage && titleValue) {
      const formData = new FormData();

      formData.append("image", file);
      formData.append("title", titleValue);
      formData.append("category", selectedValue);

      const token = sessionStorage.authToken;

      if (!token) {
          console.error("Token d'authentification manquant.");
          return;
      }

      let response = await fetch(`${url}/works`, {
          method: "POST",
          headers: {
              Authorization: "Bearer " + token,
          },
          body: formData,
      });
      if (response.status !== 201) {
          const errorText = await response.text();
          console.error("Erreur : ", errorText);
          const errorBox = document.createElement("div");
          errorBox.className = "error-login";
          errorBox.innerHTML = `Il y a eu une erreur : ${errorText}`;
          document.querySelector("form").prepend(errorBox);
      } else {
          // Réinitialiser les champs du formulaire après la soumission réussie
          titleInput.value = ""; 
          document.getElementById("category").value = "1"; 
          img.src = ""; 
          const photoContainer = document.getElementById("photo-container");
          photoContainer.innerHTML = ""; 
          document.querySelectorAll(".picture-loaded").forEach((e) => (e.style.display = "block")); 

        
          getWorks(); 
          closeModal(); 
      }
  } else {
      alert("Veuillez remplir tous les champs");
  }
});
}
