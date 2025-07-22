// digiApi.js otimizado para busca rápida

const digiApi = {};

let allBasicDigimonsCache = [];
let allDigimonsDetailCache = [];
let isAllBasicFetched = false;

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

async function fetchBasicDigimons() {
    if (isAllBasicFetched) return allBasicDigimonsCache;

    console.log("Buscando a lista básica de Digimons...");
    let all = [];
    let next = 'https://digi-api.com/api/v1/digimon?pageSize=100';

    try {
        while (next) {
            const res = await fetch(next);
            const json = await res.json();
            all = all.concat(json.content);
            next = json.pageable?.nextPage;
        }

        allBasicDigimonsCache = all;
        isAllBasicFetched = true;
        console.log(`Foram carregados ${all.length} Digimons básicos.`);
        return all;
    } catch (error) {
        console.error("Erro ao buscar Digimons básicos:", error);
        return [];
    }
}

async function enrichDigimonList(digimonList) {
    if (!digimonList || digimonList.length === 0) return [];
    try {
        const detailPromises = digimonList.map(digimon =>
            fetch(`https://digi-api.com/api/v1/digimon/${digimon.name}`)
                .then(res => res.ok ? res.json() : Promise.reject(`Falha ao buscar ${digimon.name}`))
        );
        const digimonDetails = await Promise.all(detailPromises);
        return digimonDetails.map(convertFullDetailToDigimon);
    } catch (error) {
        console.error("Falha ao enriquecer a lista de Digimons:", error);
        return [];
    }
}

digiApi.performSearch = async (query) => {
    const lowerQuery = query.toLowerCase();
    const allBasic = await fetchBasicDigimons();

    const digimonLevels = ['Fresh', 'In Training', 'Rookie', 'Champion', 'Ultimate', 'Mega', 'Armor', 'Hybrid', 'Unknown'];
    const digimonAttributes = ['Data', 'Free', 'Vaccine', 'Virus', 'Variable', 'Unknown'];
    const digimonTypes = [
        'Amphibian', 'Ancient', 'Aquatic', 'Avian', 'Beast', 'Bird', 'Bulb', 'Composite', 'Crustacean', 'Cyborg', 'Demon', 'Dragon',
        'Enhancement', 'Fairy', 'Fallen Angel', 'Food', 'Ghost', 'Giant', 'God', 'Holy', 'Insect', 'Larva', 'LCD', 'Machine', 'Magic',
        'Mammal', 'Mineral', 'Minor', 'Mollusk', 'Mutant', 'Mythical', 'Plant', 'Puppet', 'Reptile', 'Rock', 'Sea Animal', 'Seed',
        'Shaman', 'Skeleton', 'Slime', 'Undead', 'Unique', 'Unknown', 'Warrior', 'Wizard'
    ];

    const isCategory = (list) => list.find(item => item.toLowerCase() === lowerQuery);

    const level = isCategory(digimonLevels);
    const attribute = isCategory(digimonAttributes);
    const type = isCategory(digimonTypes);

    let url;
    let categoryValue;

    if (level) {
        categoryValue = level;
        url = `https://digi-api.com/api/v1/digimon?level=${encodeURIComponent(categoryValue)}&pageSize=50`;
    } else if (attribute) {
        categoryValue = attribute;
        url = `https://digi-api.com/api/v1/digimon?attribute=${encodeURIComponent(categoryValue)}&pageSize=50`;
    } else if (type) {
        categoryValue = type;
        url = `https://digi-api.com/api/v1/digimon?type=${encodeURIComponent(categoryValue)}&pageSize=50`;
    }

    if (url) {
        console.log(`Buscando por categoria: ${categoryValue}`);
        try {
            const res = await fetch(url);
            const json = await res.json();
            const enriched = await enrichDigimonList(json.content);
            console.log(`Foram encontrados ${enriched.length} Digimons na categoria "${categoryValue}".`);
            return enriched;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    // Busca rápida local por nome
    const filtered = allBasic.filter(d => d.name.toLowerCase().includes(lowerQuery));
    const limited = filtered.slice(0, 20);
    console.log(`Busca rápida encontrou ${filtered.length} digimons. Mostrando os primeiros ${limited.length}.`);
    return enrichDigimonList(limited);
};
