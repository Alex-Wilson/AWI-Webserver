// ygo-editor-app.js

document.addEventListener('DOMContentLoaded', function () {
    const cardGrid = document.getElementById('card-grid');
    const searchBar = document.getElementById('search-bar');
    const cardTypeFilter = document.getElementById('card-type-filter');
    const subtypeFilter = document.getElementById('subtype-filter');
    const rarityFilter = document.getElementById('rarity-filter');
    const levelFilter = document.getElementById('level-filter');
    let allCards = []; // Store all card data here

    // Fetch cards from the Yu-Gi-Oh! API
    async function fetchCards() {
        try {
            const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
            const data = await response.json();
            allCards = data.data; // Store the fetched cards
            displayCards(allCards); // Display all cards initially
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    }

    // Display cards in the grid
    function displayCards(cards) {
        // Clear the grid
        cardGrid.innerHTML = '';

        if (cards && cards.length > 0) {
            // Populate the grid with the cards
            cards.forEach(card => {
                card.card_images.slice(0, 1).forEach(image => { // Show one printing
                    const cardElement = document.createElement('div');
                    cardElement.className = 'card';
                    cardElement.innerHTML = `
                        <img src="${image.image_url}" alt="${card.name}">
                        <p>${card.name}</p>
                    `;
                    cardGrid.appendChild(cardElement);
                });
            });
        } else {
            cardGrid.innerHTML = '<p>No cards found.</p>';
        }
    }

    // Filter cards based on search input, card type, subtype, rarity, and level
    function filterCards() {
        const searchTerm = searchBar.value.trim().toLowerCase();
        const selectedType = cardTypeFilter.value;
        const selectedSubtype = subtypeFilter.value;
        const selectedRarity = rarityFilter.value;
        const selectedLevel = levelFilter.value;

        // First apply search if there's a search term
        let filteredCards = searchTerm ? allCards.filter(card => card.name.toLowerCase().includes(searchTerm)) : allCards;

        // Filter by card type
        if (selectedType) {
            filteredCards = filteredCards.filter(card => card.type.includes(selectedType));
        }

        // Filter by subtype
        if (selectedSubtype) {
            filteredCards = filteredCards.filter(card => card.race && card.race.includes(selectedSubtype));
        }

        // Filter by rarity
        if (selectedRarity) {
            filteredCards = filteredCards.filter(card =>
                card.card_sets && card.card_sets.some(set => set.set_rarity.includes(selectedRarity))
            );
        }

        // Filter by level (only for Monster cards)
        if (selectedLevel) {
            filteredCards = filteredCards.filter(card => card.level && card.level == selectedLevel);
        }

        displayCards(filteredCards);
    }

    // Update subtype and level options based on card type selection
    cardTypeFilter.addEventListener('change', function () {
        const selectedType = cardTypeFilter.value;
        let subtypeOptions = ['<option value="">All Subtypes</option>'];

        if (selectedType === 'Monster') {
            subtypeOptions.push('<option value="Fusion">Fusion</option>');
            subtypeOptions.push('<option value="Synchro">Synchro</option>');
            subtypeOptions.push('<option value="XYZ">XYZ</option>');
            subtypeOptions.push('<option value="Link">Link</option>');
            subtypeOptions.push('<option value="Pendulum">Pendulum</option>');

            // Show level filter for monsters
            levelFilter.style.display = 'inline-block';
            // Populate level options dynamically
            let levelOptions = ['<option value="">All Levels</option>'];
            for (let i = 1; i <= 12; i++) {
                levelOptions.push(`<option value="${i}">${i}</option>`);
            }
            levelFilter.innerHTML = levelOptions.join('');
        } else if (selectedType === 'Spell') {
            subtypeOptions.push('<option value="Field">Field</option>');
            subtypeOptions.push('<option value="Quick-Play">Quick-Play</option>');
            subtypeOptions.push('<option value="Continuous">Continuous</option>');
            subtypeOptions.push('<option value="Equip">Equip</option>');
            subtypeOptions.push('<option value="Ritual">Ritual</option>');

            // Hide level filter for non-monsters
            levelFilter.style.display = 'none';
            levelFilter.value = '';
        } else if (selectedType === 'Trap') {
            subtypeOptions.push('<option value="Continuous">Continuous</option>');
            subtypeOptions.push('<option value="Counter">Counter</option>');
            subtypeOptions.push('<option value="Normal">Normal</option>');

            // Hide level filter for non-monsters
            levelFilter.style.display = 'none';
            levelFilter.value = '';
        } else {
            // Hide level filter if no type is selected
            levelFilter.style.display = 'none';
            levelFilter.value = '';
        }

        subtypeFilter.innerHTML = subtypeOptions.join('');
        filterCards(); // Apply the filter after changing the type
    });

    // Event listeners for search and filter inputs
    searchBar.addEventListener('input', filterCards);
    subtypeFilter.addEventListener('change', filterCards);
    rarityFilter.addEventListener('change', filterCards);
    levelFilter.addEventListener('change', filterCards);

    // Initialize the card viewer
    fetchCards();
});
