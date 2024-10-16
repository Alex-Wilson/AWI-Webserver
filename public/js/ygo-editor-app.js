document.addEventListener('DOMContentLoaded', function () {
    // Get the search bar and card grid elements
    const searchBar = document.getElementById('search-bar');
    const cardGrid = document.getElementById('card-grid');
    const modal = document.getElementById('card-modal');
    const modalContent = document.getElementById('card-modal-content');
    const modalClose = document.getElementById('card-modal-close');
    const cardTypeFilter = document.getElementById('card-type-filter'); // Card type filter element

    if (!cardGrid) {
        console.error('Card grid element not found!');
        return;
    }

    let offset = 0;
    const cardsPerBatch = 50;
    let isLoading = false;
    let isSearching = false;
    let searchResults = [];
    const searchLazyLoadLimit = 300;
    let currentSearchTerm = '';
    let currentCardType = ''; // Track the current card type filter

    // Update card type filter dropdown with the correct card types
    if (cardTypeFilter) {
        cardTypeFilter.innerHTML = `
            <option value="all">All Card Types</option>
            <option value="monster">Monster</option>
            <option value="spell">Spell</option>
            <option value="trap">Trap</option>
        `;
    }

    // Retrieve search term from localStorage and set it in the search bar
    const savedSearchTerm = localStorage.getItem('searchTerm');
    if (savedSearchTerm) {
        searchBar.value = savedSearchTerm;
        currentSearchTerm = savedSearchTerm.trim().toLowerCase();
        isSearching = true;
        searchCards(currentSearchTerm); // Trigger the search using the saved term
    } else {
        displayCardsBatch(); // Display the initial batch if there's no saved search term
    }

    // Function to display a batch of cards in the card grid
    async function displayCardsBatch() {
        if (isLoading || isSearching) return;

        try {
            isLoading = true;
            const response = await fetch(`/api/cards?offset=${offset}&limit=${cardsPerBatch}`);
            const data = await response.json();
            appendCards(data || []);
            offset += cardsPerBatch;
            isLoading = false;
        } catch (error) {
            console.error("Error occurred while fetching data:", error);
            alert("An error occurred while fetching data. Please try again later.");
            isLoading = false;
        }
    }

    // Function to append cards to the card grid
    function appendCards(cards) {
        const filteredCards = cards.filter(card => {
            if (!currentCardType || currentCardType === 'all') return true;

            const cardType = card.type.toLowerCase();
            switch (currentCardType) {
                case 'monster':
                    return cardType.includes('monster') || 
                           cardType.includes('fusion') || 
                           cardType.includes('synchro') || 
                           cardType.includes('xyz') || 
                           cardType.includes('link') || 
                           cardType.includes('ritual') || 
                           cardType.includes('pendulum');
                case 'spell':
                    return cardType.includes('spell');
                case 'trap':
                    return cardType.includes('trap');
                default:
                    return false;
            }
        });

        if (filteredCards.length === 0 && offset === 0) {
            cardGrid.innerHTML = '<p>No cards match the selected criteria.</p>';
            return;
        }

        filteredCards.forEach(card => {
            card.card_images.forEach((image, index) => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                const versionText = card.card_images.length > 1 ? ` - Version ${index + 1}` : '';
                cardElement.innerHTML = `
                    <img src="${image.image_url}" alt="${card.name}${versionText}" class="card-image">
                    <p>${escapeHTML(card.name)}${versionText}</p>
                `;
                cardElement.addEventListener('click', () => {
                    displayModal(card, image, index);
                });
                cardGrid.appendChild(cardElement);
            });
        });
    }

    // Function to display the modal with card details
    function displayModal(card, image, index) {
        // Clear modal content
        modalContent.innerHTML = '';

        // Create and append the image
        const cardImage = document.createElement('img');
        cardImage.src = image.image_url;
        cardImage.alt = `${card.name} - Version ${index + 1}`;
        cardImage.className = 'card-image-large';
        modalContent.appendChild(cardImage);

        // Create and append the title
        const cardTitle = document.createElement('h2');
        const versionText = card.card_images.length > 1 ? ` - Version ${index + 1}` : '';
        cardTitle.textContent = `${card.name}${versionText}`;
        modalContent.appendChild(cardTitle);

        // Create the filter dropdown
        const rarityFilterLabel = document.createElement('p');
        rarityFilterLabel.textContent = 'Filter by Rarity:';
        modalContent.appendChild(rarityFilterLabel);

        const rarityFilter = document.createElement('select');
        rarityFilter.id = 'rarity-filter';

        // Get unique rarities for the card
        const uniqueRarities = [...new Set(card.card_sets.map(set => set.set_rarity))];

        // Add options to the dropdown based on unique rarities
        rarityFilter.innerHTML = `<option value="">All Rarities</option>`;
        uniqueRarities.forEach(rarity => {
            const option = document.createElement('option');
            option.value = rarity;
            option.textContent = rarity;
            rarityFilter.appendChild(option);
        });
        modalContent.appendChild(rarityFilter);

        // Create and append the sets list
        const packsList = document.createElement('ul');
        packsList.id = 'packs-list';
        card.card_sets.forEach(set => {
            const listItem = document.createElement('li');
            listItem.textContent = `${set.set_name} - ${set.set_rarity}`;
            listItem.setAttribute('data-rarity', set.set_rarity);
            packsList.appendChild(listItem);
        });
        modalContent.appendChild(packsList);

        // Add event listener to the rarity filter dropdown
        rarityFilter.addEventListener('change', function () {
            filterPacksByRarity(this.value);
        });

        // Show the modal
        modal.style.display = 'block';
    }

    // Function to filter packs by rarity
    function filterPacksByRarity(rarity) {
        const packsListElement = modalContent.querySelector('#packs-list');
        const listItems = packsListElement.querySelectorAll('li');

        listItems.forEach(item => {
            const itemRarity = item.getAttribute('data-rarity');
            if (!rarity || itemRarity === rarity) {
                item.style.display = 'list-item';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Add event listener to close the modal
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Add event listener to the search bar to filter cards by name
    if (searchBar) {
        searchBar.addEventListener('input', function () {
            currentSearchTerm = searchBar.value.trim().toLowerCase();
            localStorage.setItem('searchTerm', currentSearchTerm); // Save the search term

            if (currentSearchTerm) {
                isSearching = true;
                offset = 0;
                cardGrid.innerHTML = ''; // Clear existing cards before search
                searchCards(currentSearchTerm);
            } else {
                isSearching = false;
                offset = 0;
                searchResults = [];
                localStorage.removeItem('searchTerm'); // Remove the saved search term if search is cleared
                cardGrid.innerHTML = ''; // Clear existing cards
                fetchAndDisplayFilteredCards();
            }
        });
    }

    // Add event listener to the card type filter to filter cards by type
    if (cardTypeFilter) {
        cardTypeFilter.addEventListener('change', function () {
            currentCardType = cardTypeFilter.value.toLowerCase();
            offset = 0;
            cardGrid.innerHTML = ''; // Clear existing cards
            if (currentSearchTerm) {
                searchCards(currentSearchTerm); // Search with the current term and card type filter
            } else {
                fetchAndDisplayFilteredCards(); // Fetch and display cards based on the selected type
            }
        });
    }

    // Function to fetch and display cards based on the selected card type
    async function fetchAndDisplayFilteredCards() {
        if (isLoading) return;

        try {
            isLoading = true;
            const typeQuery = currentCardType && currentCardType !== 'all' ? `&type=${encodeURIComponent(currentCardType)}` : '';
            const searchQuery = currentSearchTerm ? `&term=${encodeURIComponent(currentSearchTerm)}` : '';
            const response = await fetch(`/api/cards?offset=${offset}&limit=${cardsPerBatch}${typeQuery}${searchQuery}`);
            const data = await response.json();
            appendCards(data || []);
            offset += cardsPerBatch;
            isLoading = false;
        } catch (error) {
            console.error("Error occurred while fetching filtered cards:", error);
            alert("An error occurred while fetching filtered cards. Please try again later.");
            isLoading = false;
        }
    }

    // Function to search cards from the server
    async function searchCards(query, searchOffset = 0) {
        try {
            isLoading = true;
            const typeQuery = currentCardType && currentCardType !== 'all' ? `&type=${encodeURIComponent(currentCardType)}` : '';
            const response = await fetch(`/api/cards/search?term=${encodeURIComponent(query)}&offset=${searchOffset}&limit=${cardsPerBatch}${typeQuery}`);
            const data = await response.json();

            if (searchOffset === 0) {
                searchResults = data.cards || [];
                cardGrid.innerHTML = ''; // Clear existing cards before displaying search results
                if (searchResults.length > searchLazyLoadLimit) {
                    appendCards(searchResults.slice(0, 300));
                    offset = 300;
                } else {
                    appendCards(searchResults);
                    offset = searchResults.length;
                }
            } else {
                searchResults = searchResults.concat(data.cards || []);
                appendCards(searchResults.slice(0, offset + cardsPerBatch));
                offset += cardsPerBatch;
            }

            isLoading = false;
        } catch (error) {
            console.error("Error occurred while searching for cards:", error);
            alert("An error occurred while searching for cards. Please try again later.");
            isLoading = false;
        }
    }

    // Add an event listener for scrolling to implement lazy loading
    window.addEventListener('scroll', async () => {
        if (!isLoading && (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100)) {
            if (isSearching && searchResults.length > offset) {
                await searchCards(currentSearchTerm, offset);
            } else if (!isSearching) {
                await displayCardsBatch();
            }
        }
    });

    // Trigger search if a search term exists on page reload
    if (savedSearchTerm) {
        searchCards(savedSearchTerm);
    }

    // Function to escape HTML to prevent XSS
    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
