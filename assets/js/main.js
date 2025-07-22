// --- Elementos do DOM ---
const loadMoreButton = document.getElementById("loadMoreButton");
const digimonList = document.getElementById("digimonList");
const searchInput = document.querySelector(".input");
const searchButton = document.querySelector(".btnSearch");
const clearButton = document.querySelector(".btnClear");
const loadingIndicator = document.getElementById("loadingIndicator");

// --- Variáveis de Estado ---
let currentPage = 0;
const pageSize = 15;
let isSearchActive = false;

// --- Funções auxiliares ---

// Gera o HTML para um item da lista de Digimon
function digimonToLi(digimon) {
    return `
        <li class="digimon ${digimon.type}" data-digimon-name="${digimon.name}">
            <span class="name">${digimon.name}</span>
            <div class="detail">
                <ol class="types">
                    <li class="type">${digimon.level}</li>
                    <li class="type">${digimon.actualType}</li>
                    <li class="type">${digimon.attribute}</li>
                </ol>
                <img src="${digimon.photo}" alt="${digimon.name}">
            </div>
        </li>
    `;
}

// --- Funções Principais ---

// Carrega os itens de Digimon com paginação
function loadDigimonItems(page, size) {
    if (isSearchActive) return;

    loadingIndicator.style.display = "block";

    digiApi.getDigimons(page, size).then((response) => {
        loadingIndicator.style.display = "none";
        const newHtml = response.content.map(digimonToLi).join("");
        digimonList.innerHTML += newHtml;

        const hasNextPage = response.pageable && response.pageable.nextPage;
        if (!hasNextPage) {
            loadMoreButton.style.display = "none";
        }
    });
}

// Realiza uma busca na lista de Digimons
function searchDigimon() {
    const query = searchInput.value.trim().toLowerCase();

    if (query === "") {
        clearSearch();
        return;
    }

    isSearchActive = true;
    digimonList.innerHTML = "";
    loadMoreButton.style.display = "none";
    loadingIndicator.style.display = "block";

    digiApi.performSearch(query).then(filteredList => {
        loadingIndicator.style.display = "none";
        if (filteredList.length > 0) {
            const newHtml = filteredList.map(digimonToLi).join("");
            digimonList.innerHTML = newHtml;
        } else {
            digimonList.innerHTML = `<li class="search-message">No Digimon found.</li>`;
        }
    });
}

// Limpa os resultados da busca e restaura a lista paginada
function clearSearch() {
    searchInput.value = "";
    digimonList.innerHTML = "";
    currentPage = 0;
    isSearchActive = false;
    loadMoreButton.style.display = "block";
    loadDigimonItems(currentPage, pageSize);
}

// --- Event Listeners ---

searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        searchDigimon();
    }
});

digimonList.addEventListener('click', (event) => {
    const listItem = event.target.closest('.digimon');
    if (listItem && listItem.dataset.digimonName) {
        window.location.href = `digivice.html?digimon=${listItem.dataset.digimonName}`;
    }
});

searchButton.addEventListener("click", searchDigimon);
clearButton.addEventListener("click", clearSearch);
loadMoreButton.addEventListener("click", () => {
    currentPage++;
    loadDigimonItems(currentPage, pageSize);
});

// --- Carga Inicial ---
loadDigimonItems(currentPage, pageSize);
