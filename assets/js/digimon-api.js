// digiApi.js corrigido

const digiApi = {};

// Cache para armazenar a lista completa de Digimons para a busca
let allDigimonsCache = [];
let isAllFetched = false;

// Converte o objeto de detalhes completo da API para o nosso modelo Digimon
function convertFullDetailToDigimon(digiDetail) {
    const digimon = new Digimon();
    digimon.name = digiDetail.name;
    digimon.photo = digiDetail.images?.[0]?.href;
    digimon.level = digiDetail.levels?.[0]?.level || 'Unknown';
    digimon.actualType = digiDetail.types?.[0]?.type || 'Unknown';
    digimon.attribute = digiDetail.attributes?.[0]?.attribute || 'Unknown';
    digimon.type = digimon.level.toLowerCase().replace(/\s+/g, '-');
    digimon.types = [digimon.level];
    return digimon;
}

async function enrichDigimonList(digimonList, delay = 150) {
    if (!digimonList || digimonList.length === 0) return [];
    const enrichedList = [];

    for (const digimon of digimonList) {
        try {
            const response = await fetch(`https://digi-api.com/api/v1/digimon/${digimon.name}`);
            if (!response.ok) throw new Error(`Erro ao buscar Digimon: ${digimon.name}`);
            const data = await response.json();
            enrichedList.push(convertFullDetailToDigimon(data));
        } catch (error) {
            console.warn("Erro ao enriquecer Digimon:", digimon.name, error.message);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    return enrichedList;
}

digiApi.getDigimons = async (page = 0, pageSize = 10) => {
    const listUrl = `https://digi-api.com/api/v1/digimon?page=${page}&pageSize=${pageSize}`;
    try {
        const listResponse = await fetch(listUrl);
        const listJson = await listResponse.json();
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

const fetchAllDigimons = async () => {
    if (isAllFetched) return Promise.resolve(allDigimonsCache);

    console.log("Buscando a lista completa de Digimons para o cache de busca...");
    let allDigimons = [];
    let currentPageUrl = `https://digi-api.com/api/v1/digimon?pageSize=50`;

    try {
        while (currentPageUrl) {
            const response = await fetch(currentPageUrl);
            const data = await response.json();
            allDigimons = allDigimons.concat(data.content);
            currentPageUrl = data.pageable.nextPage;
        }

        allDigimonsCache = await enrichDigimonList(allDigimons);
        isAllFetched = true;
        console.log(`Cache de busca preenchido com ${allDigimonsCache.length} Digimons.`);
        return allDigimonsCache;
    } catch (error) {
        console.error("Falha ao buscar todos os Digimons:", error);
        return [];
    }
};

fetchAllDigimons();

const searchDigimonsByName = async (query) => {
    const fullList = await fetchAllDigimons();
    return fullList.filter(digimon =>
        digimon.name.toLowerCase().includes(query)
    );
};

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

    const findCategory = (list) => list.find(item => item.toLowerCase() === lowerCaseQuery);

    const level = findCategory(digimonLevels);
    const attribute = findCategory(digimonAttributes);
    const type = findCategory(digimonTypes);

    let url;
    let categoryValue;

    if (level) {
        categoryValue = level;
        url = `https://digi-api.com/api/v1/digimon?level=${encodeURIComponent(categoryValue)}&pageSize=200`;
    } else if (attribute) {
        categoryValue = attribute;
        url = `https://digi-api.com/api/v1/digimon?attribute=${encodeURIComponent(categoryValue)}&pageSize=200`;
    } else if (type) {
        categoryValue = type;
        url = `https://digi-api.com/api/v1/digimon?type=${encodeURIComponent(categoryValue)}&pageSize=200`;
    }

    if (url) {
        console.log(`Buscando por categoria: ${categoryValue}`);
        try {
            const categoryResponse = await fetch(url);
            if (!categoryResponse.ok) throw new Error(`Erro na busca por categoria: ${categoryResponse.status}`);
            const categoryJson = await categoryResponse.json();
            const enrichedList = await enrichDigimonList(categoryJson.content);

            console.log(`Foram encontrados ${enrichedList.length} Digimons na categoria "${categoryValue}".`);

            return enrichedList;
        } catch (error) {
            console.error(error);
            return [];
        }
    }

    const nameResults = await searchDigimonsByName(lowerCaseQuery);
    return nameResults;
};
