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