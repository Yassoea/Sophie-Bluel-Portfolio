const url = "http://localhost:5678/api";

getWorks();
getCategories();

async function getWorks(filter) {
    document.querySelector(".gallery").innerHTML = "";
    document.querySelector(".modal-gallery").innerHTML = "";
  
    try {
      const response = await fetch(`${url}/works`);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
      const json = await response.json();
      if (filter) {
        const filtered = json.filter((data) => data.categoryId === filter);
        for (let i = 0; i < filtered.length; i++) {
          setFigure(filtered[i]);
          setFigureModal(filtered[i]);
        }
      } else {
        for (let i = 0; i < json.length; i++) {
          setFigure(json[i]);
          setFigureModal(json[i]);
        }
      }
      // On appelle la fonction deleteWork ici pour pouvoir cibler fa-trash-can
      const trashCans = document.querySelectorAll(".fa-trash-can");
      trashCans.forEach((e) =>
        e.addEventListener("click", (event) => deleteWork(event))
      );
    } catch (error) {
      console.error(error.message);
    }
  }
  
  // Integration a la galerie des figures (image + titre)
  function setFigure(data) {
    const figure = document.createElement("figure");
    figure.innerHTML = `<img src=${data.imageUrl} alt=${data.title}>
                      <figcaption>${data.title}</figcaption>`;
  
    document.querySelector(".gallery").append(figure);
  }

  //Recuperation des categories depuis l'API
async function getCategories() {
    try {
      const response = await fetch(`${url}/categories`);
      if (!response.ok) {
        throw new Error(`Response status: ${response.status}`);
      }
  
      const json = await response.json();
      for (let i = 0; i < json.length; i++) {
        setFilter(json[i]);
      }
    } catch (error) {
      console.error(error.message);
    }
  }
  
  // Ajout des eventListeners aux filtres
  function setFilter(data) {
    const div = document.createElement("div");
    div.className = data.id;
    div.addEventListener("click", () => getWorks(data.id));
    div.addEventListener("click", (event) => toggleFilter(event));
    document
      .querySelector(".tous")
      .addEventListener("click", (event) => toggleFilter(event));
    div.innerHTML = `${data.name}`;
    document.querySelector(".div-container").append(div);
  }