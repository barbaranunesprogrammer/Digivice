const loadMoreButton = document.getElementById("loadMoreButton");
const digimonList = document.getElementById("digimonList");
const searchInput = document.querySelector(".input");
const searchButton = document.querySelector(".btnSearch");
const clearButton = document.querySelector(".btnClear");
const loadingIndicator = document.getElementById("loadingIndicator");

let currentPage = 0;
const pageSize = 15;
let isSearchActive = false;
let totalPages = Infinity;

function digimonToLi(digimon) {
    const level = digimon.level || "Unknown";
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

async function loadDigimonItems(page, size) {
    if (isSearchActive || page >= totalPages) return;

    loadingIndicator.style.display = "block";

    try {
        const result = await digiApi.fetchPaginatedDigimons(page, size);
        const enriched = await digiApi.enrichDigimonList(result.content);

        const newHtml = enriched.map(digimonToLi).join("");
        digimonList.innerHTML += newHtml;

        totalPages = result.totalPages;
        if (page + 1 >= totalPages) {
            loadMoreButton.style.display = "none";
        }

    } catch (error) {
        console.error("Erro ao carregar Digimons:", error);
    } finally {
        loadingIndicator.style.display = "none";
    }
}

async function searchDigimon() {
    const query = searchInput.value.trim().toLowerCase();
    if (query === "") return clearSearch();

    isSearchActive = true;
    digimonList.innerHTML = "";
    loadMoreButton.style.display = "none";
    loadingIndicator.style.display = "block";

    try {
        const results = await digiApi.performSearch(query);
        const enriched = await digiApi.enrichDigimonList(results);

        if (enriched.length > 0) {
            digimonList.innerHTML = enriched.map(digimonToLi).join("");
        } else {
            digimonList.innerHTML = `<li class="search-message">No Digimon found.</li>`;
        }
    } catch (error) {
        console.error("Erro na busca:", error);
        digimonList.innerHTML = `<li class="search-message">Erro ao buscar Digimon.</li>`;
    } finally {
        loadingIndicator.style.display = "none";
    }
}

function clearSearch() {
    searchInput.value = "";
    digimonList.innerHTML = "";
    currentPage = 0;
    isSearchActive = false;
    totalPages = Infinity;
    loadMoreButton.style.display = "block";
    loadDigimonItems(currentPage, pageSize);
}

// Eventos
searchInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") searchDigimon();
});
searchButton.addEventListener("click", searchDigimon);
clearButton.addEventListener("click", clearSearch);
loadMoreButton.addEventListener("click", () => {
    currentPage++;
    loadDigimonItems(currentPage, pageSize);
});
digimonList.addEventListener('click', (event) => {
    const listItem = event.target.closest('.digimon');
    if (listItem?.dataset.digimonName) {
        window.location.href = `digivice.html?digimon=${listItem.dataset.digimonName}`;
    }
});

// Inicial
loadDigimonItems(currentPage, pageSize);
