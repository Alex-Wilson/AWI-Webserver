document.addEventListener('DOMContentLoaded', function () {
    const cardGrid = document.getElementById('card-grid');
    const searchBar = document.getElementById('search-bar');
    let loadedCards = 0; // Track how many cards are loaded
    const cardsPerBatch = 50; // Number of cards to load at a time
    let isLoading = false; // Track if a fetch request is in progress

    // Arrays for each filter category (same as before)
    const cardTypes = ['Monster', 'Spell', 'Trap'];
    const attributes = ['LIGHT', 'DARK', 'WATER', 'FIRE', 'EARTH', 'WIND', 'DIVINE'];
    const spellTypes = ['Normal', 'Field', 'Equip', 'Continuous', 'Quick-Play', 'Ritual'];
    const trapTypes = ['Normal', 'Continuous', 'Counter'];
    const cardRaces = [
        'Spellcaster', 'Dragon', 'Zombie', 'Warrior', 'Beast-Warrior', 'Beast', 
        'Winged Beast', 'Machine', 'Fiend', 'Fairy', 'Insect', 'Dinosaur', 
        'Reptile', 'Fish', 'Sea Serpent', 'Aqua', 'Pyro', 'Thunder', 'Rock', 
        'Plant', 'Psychic', 'Wyrm', 'Cyberse', 'Divine-Beast', 'Illusion'
    ];
    const levels = Array.from({ length: 12 }, (_, i) => (i + 1).toString()); // Levels 1 to 12
    const linkRatings = Array.from({ length: 6 }, (_, i) => (i + 1).toString()); // Link Ratings 1 to 6
    const rarities = ['N', 'R', 'SR', 'UR']; // Rarities

    // Function to create buttons dynamically
    function createButtons(options, containerId) {
        const container = document.getElementById(containerId);
        options.forEach(option => {
            const button = document.createElement('button');
            button.textContent = option;
            button.addEventListener('click', () => {
                console.log(`Filter selected: ${option}`);
                // Implement filter logic here
            });
            container.appendChild(button);
        });
    }

    // Generate buttons for each filter category
    createButtons(cardTypes, 'card-type-buttons');
    createButtons(attributes, 'attribute-buttons');
    createButtons(spellTypes, 'spell-type-buttons');
    createButtons(trapTypes, 'trap-type-buttons');
    createButtons(cardRaces, 'card-race-buttons');
    createButtons(levels, 'level-buttons');
    createButtons(linkRatings, 'link-rating-buttons');
    createButtons(rarities, 'rarity-buttons');

    // Fetch a batch of cards from the Yu-Gi-Oh! API
    async function fetchCardsBatch(offset = 0, limit = cardsPerBatch) {
        try {
            isLoading = true;
            const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?offset=${offset}&num=${limit}`);
            const data = await response.json();
            displayCards(data.data);
            isLoading = false;
        } catch (error) {
            console.error('Error fetching cards:', error);
            isLoading = false;
        }
    }

    // Display cards in the grid
    function displayCards(cards) {
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
        loadedCards += cards.length;
    }

    // Lazy loading: Load more cards when the user scrolls to the bottom
    window.addEventListener('scroll', () => {
        if (!isLoading && (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100)) {
            fetchCardsBatch(loadedCards); // Load the next batch of cards
        }
    });

    // Initialize the card viewer
    fetchCardsBatch(loadedCards);
});
