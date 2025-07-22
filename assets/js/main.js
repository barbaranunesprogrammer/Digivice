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

// --- Categorias conhecidas ---
const digimonLevels = ['Fresh', 'In Training', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Armor', 'Hybrid', 'Unknown'];
const digimonAttributes = ['Data', 'Free', 'Vaccine', 'Virus', 'Variable', 'Unknown'];
const digimonTypes = [
    'Amphibian', 'Ancient', 'Aquatic', 'Avian', 'Beast', 'Bird', 'Bulb', 'Composite', 'Crustacean', 'Cyborg', 'Demon', 'Dragon',
    'Enhancement', 'Fairy', 'Fallen Angel', 'Food', 'Ghost', 'Giant', 'God', 'Holy', 'Insect', 'Larva', 'LCD', 'Machine', 'Magic',
    'Mammal', 'Mineral', 'Minor', 'Mollusk', 'Mutant', 'Mythical', 'Plant', 'Puppet', 'Reptile', 'Rock', 'Sea Animal', 'Seed',
    'Shaman', 'Skeleton', 'Slime', 'Undead', 'Unique', 'Unknown', 'Warrior', 'Wizard'
];

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

function enrichDigimonList(list) {
    return list.map(item => ({
        name: item.name,
        level: item.levels?.[0]?.level || "Unknown",
        actualType: item.types?.[0]?.type || "Unknown",
        attribute: item.attributes?.[0]?.attribute || "Unknown",
        photo: item.images?.[0]?.href || "https://via.placeholder.com/150",
    }));
}

// Busca em todas as páginas até terminar
async function fetchAllFromCategory(category, value) {
    let results = [];
    let url = `https://digi-api.com/api/v1/digimon?${category}=${encodeURIComponent(value)}&pageSize=50`;

    while (url) {
        const res = await fetch(url);
        const data = await res.json();
        results = results.concat(data.content);
        url = data.pageable?.nextPage || null;
    }

    return enrichDigimonList(results);
}

// Busca por nome diretamente
async function searchDigimonsByName(query) {
    const res = await fetch(`https://digi-api.com/api/v1/digimon/${query}`);
    if (!res.ok) return [];
    const data = await res.json();
    return enrichDigimonList([data]);
}

// Função principal de busca
digiApi.performSearch = async (query) => {
    const lower = query.toLowerCase();

    const isLevel = digimonLevels.find(l => l.toLowerCase() === lower);
    const isAttribute = digimonAttributes.find(a => a.toLowerCase() === lower);
    const isType = digimonTypes.find(t => t.toLowerCase() === lower);

    if (isLevel) return await fetchAllFromCategory("level", isLevel);
    if (isAttribute) return await fetchAllFromCategory("attribute", isAttribute);
    if (isType) return await fetchAllFromCategory("type", isType);

    return await searchDigimonsByName(lower);
};

// --- Funções Principais ---

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
        digimonList.innerHTML = filteredList.length > 0
            ? filteredList.map(digimonToLi).join("")
            : `<li class="search-message">No Digimon found.</li>`;
    });
}

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
    if (event.key === "Enter") searchDigimon();
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
