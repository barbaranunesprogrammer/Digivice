document.addEventListener('DOMContentLoaded', () => {
    function getDigimonNameFromURL() {
        const params = new URLSearchParams(window.location.search);
        return params.get('digimon');
    }

    function cssClassFromLevel(level) {
        return level.toLowerCase().replace(/\s+/g, '-');
    }

    function showDigimonDetail(digimonData) {
        const detailContainer = document.getElementById('digimon-detail');
        if (!detailContainer) {
            console.error("Elemento com id 'digimon-detail' não encontrado!");
            return;
        }
        detailContainer.classList.add('content-digi');

        const name = digimonData.name || 'Desconhecido';
        const imageUrl = digimonData.images?.[0]?.href || digimonData.image || '';
        const level = digimonData.level || digimonData.levels?.[0]?.level || 'N/A';
        const attribute = digimonData.attribute || digimonData.attributes?.[0]?.attribute || 'N/A';
        const type = digimonData.type || digimonData.types?.[0]?.type || 'N/A';
        const releaseDate = digimonData.releaseDate || 'N/A';
        const fields = digimonData.fields || [];
        const descriptions = digimonData.descriptions?.filter(d => d.language === 'en_us') || [];
        const description = descriptions.length > 0 ? descriptions[0].description : 'Nenhuma descrição disponível.';

        detailContainer.innerHTML = `
            <h2 class="name-digi ${cssClassFromLevel(level)}">${name}</h2>
            <div class="details-digi">
                ${imageUrl ? `<img class="img-digi" src="${imageUrl}" alt="${name}">` : ''}
                <div class="info-digi">
                    <p><strong>Level:</strong> ${level}</p>
                    <p><strong>Attribute:</strong> ${attribute}</p>
                    <p><strong>Type:</strong> ${type}</p>
                    <p><strong>Data de Lançamento:</strong> ${releaseDate}</p>
                </div>
            </div>
            ${fields.length > 0 ? `
            <div class="fields-digi">
                <h3>Campos (Fields)</h3>
                <ul class="fields-list">
                    ${fields.map(field => `
                        <li class="field-item">
                            <img src="${field.image}" alt="${field.field}" class="field-icon">
                            <span>${field.field}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}
            <div class="description-digi">
                <h3>Descrição</h3>
                <p>${description}</p>
            </div>
        `;
    }

    const digimonName = getDigimonNameFromURL();

    if (digimonName) {
        fetch(`https://digi-api.com/api/v1/digimon/${digimonName}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Digimon não encontrado (status: ${response.status})`);
                }
                return response.json();
            })
            .then(digimonData => {
                showDigimonDetail(digimonData);
            })
            .catch(err => {
                console.error("Erro ao carregar detalhes do Digimon:", err);
                const detailContainer = document.getElementById('digimon-detail');
                if (detailContainer) {
                    detailContainer.innerHTML = `<h2 class="search-message">Não foi possível carregar os detalhes do Digimon.</h2>`;
                }
            });
    }

    const button = document.getElementById("voltar");
    if (button) {
        button.classList.add('voltar');
        button.addEventListener("click", () => {
            window.history.back();
        });
    }
});
