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
function digimonToLi(digimon) {
    const level = digimon.level || digimon.levels?.[0]?.level || "Unknown";
    const actualType = digimon.actualType || "Unknown";
    const attribute = digimon.attribute || "Unknown";
    const type = digimon.type || "unknown";
    const photo = digimon.photo || "https://via.placeholder.com/150";

    return `
        <li class="digimon ${type}" data-digimon-name="${digimon.name}">
            <span class="name">${digimon.name}</span>
            <div class="detail">
                <ol class="types">
                    <li class="type"><strong>Level:</strong> ${level}</li>
                    <li class="type"><strong>Type:</strong> ${actualType}</li>
                    <li class="type"><strong>Attribute:</strong> ${attribute}</li>
                </ol>
                <img src="${photo}" alt="${digimon.name}">
            </div>
        </li>
    `;
}

// --- Carrega os Digimons com paginação ---
function loadDigimonItems(page, size) {
    if (isSearchActive) return;

    loadingIndicator.style.display = "block";

    digiApi.fetchBasicDigimons().then(all => {
        loadingIndicator.style.display = "none";

        const start = page * size;
        const end = start + size;
        const pageItems = all.slice(start, end);

        digiApi.enrichDigimonList(pageItems).then(enriched => {
            const newHtml = enriched.map(digimonToLi).join("");
            digimonList.innerHTML += newHtml;

            if (end >= all.length) {
                loadMoreButton.style.display = "none";
            }
        });
    });
}

// --- Busca Digimons ---
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
            digimonList.innerHTML = `<li class="search-message">Nenhum Digimon encontrado.</li>`;
        }
    });
}

// --- Limpa busca ---
function clearSearch() {
    searchInput.value = "";
    digimonList.innerHTML = "";
    currentPage = 0;
    isSearchActive = false;
    loadMoreButton.style.display = "block";
    loadDigimonItems(currentPage, pageSize);
}

// --- Eventos ---
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
        searchDigimon();
    }
});

searchButton.addEventListener("click", searchDigimon);
clearButton.addEventListener("click", clearSearch);
loadMoreButton.addEventListener("click", () => {
    currentPage++;
    loadDigimonItems(currentPage, pageSize);
});

digimonList.addEventListener("click", (event) => {
    const listItem = event.target.closest(".digimon");
    if (listItem && listItem.dataset.digimonName) {
        window.location.href = `digivice.html?digimon=${listItem.dataset.digimonName}`;
    }
});

// --- Inicial ---
loadDigimonItems(currentPage, pageSize);
