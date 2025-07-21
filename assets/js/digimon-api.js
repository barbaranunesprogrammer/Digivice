const digiApi ={}

// Cache para armazenar a lista completa de Digimons para a busca
let allDigimonsCache = [];
let isAllFetched = false;

// Converte o objeto de detalhes completo da API para o nosso modelo Digimon
function convertFullDetailToDigimon(digiDetail) {
    const digimon = new Digimon();
    digimon.name = digiDetail.name;
    digimon.photo = digiDetail.images?.[0]?.href;
    digimon.level = digiDetail.levels?.[0]?.level || 'Unknown'; // Ex: "Rookie", "In Training"
    digimon.actualType = digiDetail.types?.[0]?.type || 'Unknown'; // Ex: "Insect", "Dragon"
    digimon.attribute = digiDetail.attributes?.[0]?.attribute || 'Unknown'; // Ex: "Vaccine", "Data"
    // A propriedade 'type' será usada para a classe CSS, convertendo "In Training" para "in-training"
    digimon.type = digimon.level.toLowerCase().replace(/\s+/g, '-');
    digimon.types = [digimon.level];
    return digimon;
}

// Função auxiliar para buscar os detalhes de uma lista de Digimons básicos
async function enrichDigimonList(digimonList) {
    if (!digimonList || digimonList.length === 0) {
        return [];
    }
    try {
        // Cria um array de Promises, cada uma buscando os detalhes de um Digimon
        const detailPromises = digimonList.map(digimon =>
            fetch(`https://digi-api.com/api/v1/digimon/${digimon.name}`)
                .then(res => res.ok ? res.json() : Promise.reject(`Falha ao buscar ${digimon.name}`))
        );
        // Espera todas as buscas de detalhes terminarem
        const digimonDetails = await Promise.all(detailPromises);
        // Converte os detalhes completos para o nosso modelo
        return digimonDetails.map(convertFullDetailToDigimon);
    } catch (error) {
        console.error("Falha ao enriquecer a lista de Digimons:", error);
        return [];
    }
}

digiApi.getDigimons = async (page = 0, pageSize = 10) => {
    const listUrl = `https://digi-api.com/api/v1/digimon?page=${page}&pageSize=${pageSize}`;
    try {
        const listResponse = await fetch(listUrl);
        const listJson = await listResponse.json();
        // Pega a lista básica e busca os detalhes de cada um
        const enrichedContent = await enrichDigimonList(listJson.content);

        return {
            content: enrichedContent,
            pageable: listJson.pageable
        };
    } catch (error) {
        console.error("Falha ao buscar Digimons:", error);
        return { content: [], pageable: {} };
    }
};

// Função para buscar TODOS os Digimons de todas as páginas (para a busca)
const fetchAllDigimons = async () => {
    if (isAllFetched) {
        return Promise.resolve(allDigimonsCache);
    }

    console.log("Buscando a lista completa de Digimons para o cache de busca...");
    let allDigimons = [];
    let currentPageUrl = `https://digi-api.com/api/v1/digimon?pageSize=50`; // pageSize maior para menos requisições

    try {
        while (currentPageUrl) {
            const response = await fetch(currentPageUrl);
            const data = await response.json();
            allDigimons = allDigimons.concat(data.content);
            currentPageUrl = data.pageable.nextPage; // URL da próxima página ou null
        }
        // O cache de busca só precisa de nome e imagem, não precisa de detalhes completos.
        allDigimonsCache = allDigimons.map(d => ({ name: d.name, image: d.image }));
        isAllFetched = true;
        console.log(`Cache de busca preenchido com ${allDigimonsCache.length} Digimons.`);
        return allDigimonsCache;
    } catch (error) {
        console.error("Falha ao buscar todos os Digimons:", error);
        return [];
    }
}

// Inicia o cache para a busca em segundo plano
fetchAllDigimons();

const searchDigimonsByName = async (query) => {
    const fullList = await fetchAllDigimons(); // Garante que o cache está pronto
    return fullList.filter(digimon =>
        digimon.name.toLowerCase().includes(query)
    );
};

// Listas para busca por categoria (case-insensitive)
// Use the exact, case-sensitive names the API expects.
const digimonLevels = ['Fresh', 'In Training', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Armor', 'Hybrid', 'Unknown'];
const digimonAttributes = ['Data', 'Free', 'Vaccine', 'Virus', 'Variable', 'Unknown'];
const digimonTypes = [
    'Amphibian', 'Ancient', 'Aquatic', 'Avian', 'Beast', 'Bird', 'Bulb', 'Composite', 'Crustacean', 'Cyborg', 'Demon', 'Dragon',
    'Enhancement', 'Fairy', 'Fallen Angel', 'Food', 'Ghost', 'Giant', 'God', 'Holy', 'Insect', 'Larva', 'LCD', 'Machine', 'Magic',
    'Mammal', 'Mineral', 'Minor', 'Mollusk', 'Mutant', 'Mythical', 'Plant', 'Puppet', 'Reptile', 'Rock', 'Sea Animal', 'Seed',
    'Shaman', 'Skeleton', 'Slime', 'Undead', 'Unique', 'Unknown', 'Warrior', 'Wizard'
];

digiApi.performSearch = async (query) => {
    const lowerCaseQuery = query.toLowerCase();

    // Helper to find the correct, case-sensitive category name from our lists
    const findCategory = (list) => list.find(item => item.toLowerCase() === lowerCaseQuery);

    const level = findCategory(digimonLevels);
    const attribute = findCategory(digimonAttributes);
    const type = findCategory(digimonTypes);

    let url;
    let categoryValue;

    if (level) {
        categoryValue = level;
        url = `https://digi-api.com/api/v1/digimon?level=${encodeURIComponent(categoryValue)}`;
    } else if (attribute) {
        categoryValue = attribute;
        url = `https://digi-api.com/api/v1/digimon?attribute=${encodeURIComponent(categoryValue)}`;
    } else if (type) {
        categoryValue = type;
        url = `https://digi-api.com/api/v1/digimon?type=${encodeURIComponent(categoryValue)}`;
    }

    // Se uma URL de categoria foi encontrada, busca por ela
    if (url) {
        console.log(`Buscando por categoria: ${categoryValue}`);
        try {
            const categoryResponse = await fetch(url);
            if (!categoryResponse.ok) throw new Error(`Erro na busca por categoria: ${categoryResponse.status}`);
            const categoryJson = await categoryResponse.json();
            // Pega a lista da categoria e busca os detalhes de cada um
            return enrichDigimonList(categoryJson.content);
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    // Se não, busca por nome como fallback
    const nameResults = await searchDigimonsByName(lowerCaseQuery);
    return enrichDigimonList(nameResults);
};