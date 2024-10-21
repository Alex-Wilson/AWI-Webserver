document.addEventListener('DOMContentLoaded', function () {
    // Get references to elements
    const searchBar = document.getElementById('search-bar');
    const cardGrid = document.getElementById('card-grid');
    const modal = document.getElementById('card-modal');
    const modalContent = document.getElementById('card-modal-content');

    // Filter elements
    const rarityFilter = document.getElementById('rarity-filter');
    const cardTypeFilter = document.getElementById('card-type-filter');
    const monsterTypeFilter = document.getElementById('monster-type-filter');
    const monsterSubTypeFilter = document.getElementById('monster-sub-type-filter');
    const monsterAbilityFilter = document.getElementById('monster-ability-filter');
    const monsterRaceFilter = document.getElementById('monster-race-filter');
    const monsterAttributeFilter = document.getElementById('monster-attribute-filter');
    const monsterLevelFilter = document.getElementById('monster-level-filter');
    const monsterRankFilter = document.getElementById('monster-rank-filter');
    const linkRatingFilter = document.getElementById('link-rating-filter');
    const pendulumScaleFilter = document.getElementById('pendulum-scale-filter');
    const spellTypeFilter = document.getElementById('spell-type-filter');
    const trapTypeFilter = document.getElementById('trap-type-filter');

    // Reset Filters Button
    const resetFiltersButton = document.getElementById('reset-filters-button');

    // Message area to display number of cards
    const cardsCountMessage = document.getElementById('cards-count-message');

    // Variables
    let offset = 0;
    const cardsPerBatch = 50;
    let isLoading = false;
    let isSearching = false;
    let searchResults = [];
    let currentSearchTerm = '';

    // Retrieve search term from localStorage and set it in the search bar
    const savedSearchTerm = localStorage.getItem('searchTerm');
    if (savedSearchTerm) {
        searchBar.value = savedSearchTerm;
        currentSearchTerm = savedSearchTerm.trim();
        isSearching = true;
        searchCards(currentSearchTerm); // Trigger the search using the saved term
    } else {
        fetchAndDisplayFilteredCards(); // Display the initial batch if there's no saved search term
    }

    // Function to get current filter values
    function getCurrentFilters() {
        return {
            rarity: rarityFilter ? rarityFilter.value : '',
            cardType: cardTypeFilter ? cardTypeFilter.value : '',
            monsterType: monsterTypeFilter ? monsterTypeFilter.value : '',
            monsterSubType: monsterSubTypeFilter ? monsterSubTypeFilter.value : '',
            monsterAbility: monsterAbilityFilter ? monsterAbilityFilter.value : '',
            monsterRace: monsterRaceFilter ? monsterRaceFilter.value : '',
            monsterAttribute: monsterAttributeFilter ? monsterAttributeFilter.value : '',
            monsterLevel: monsterLevelFilter ? monsterLevelFilter.value : '',
            monsterRank: monsterRankFilter ? monsterRankFilter.value : '',
            linkRating: linkRatingFilter ? linkRatingFilter.value : '',
            pendulumScale: pendulumScaleFilter ? pendulumScaleFilter.value : '',
            spellType: spellTypeFilter ? spellTypeFilter.value : '',
            trapType: trapTypeFilter ? trapTypeFilter.value : ''
        };
    }

    // Function to display a batch of cards
    async function fetchAndDisplayFilteredCards() {
        if (isLoading) return;

        try {
            isLoading = true;
            const filters = getCurrentFilters();
            const queryParams = new URLSearchParams({
                offset: offset,
                limit: cardsPerBatch,
                term: currentSearchTerm,
                ...filters
            });

            const response = await fetch(`/api/cards?${queryParams.toString()}`);
            const data = await response.json();

            if (offset === 0) {
                cardGrid.innerHTML = ''; // Clear existing cards
            }

            if (data.length === 0) {
                // No more cards to fetch
                isLoading = false;
                return;
            }

            appendCards(data || []);
            offset += data.length; // Update offset based on actual number of cards returned
            updateCardsCountMessage(offset);

            isLoading = false;
        } catch (error) {
            console.error("Error occurred while fetching filtered cards:", error);
            alert("An error occurred while fetching filtered cards. Please try again later.");
            isLoading = false;
        }
    }

    // Function to search cards from the server
    async function searchCards(query, searchOffset = 0) {
        if (isLoading) return;

        try {
            isLoading = true;
            const filters = getCurrentFilters();
            const queryParams = new URLSearchParams({
                term: query,
                offset: searchOffset,
                limit: cardsPerBatch,
                ...filters
            });

            const response = await fetch(`/api/cards/search?${queryParams.toString()}`);
            const data = await response.json();

            if (searchOffset === 0) {
                searchResults = data.cards || [];
                cardGrid.innerHTML = ''; // Clear existing cards before displaying search results
                appendCards(searchResults);
                offset = data.cards.length;
            } else {
                if (data.cards.length === 0) {
                    // No more cards to fetch
                    isLoading = false;
                    return;
                }
                searchResults = searchResults.concat(data.cards || []);
                appendCards(data.cards || []); // Append only the new cards
                offset += data.cards.length;
            }

            updateCardsCountMessage(searchResults.length);

            isLoading = false;
        } catch (error) {
            console.error("Error occurred while searching for cards:", error);
            alert("An error occurred while searching for cards. Please try again later.");
            isLoading = false;
        }
    }

    // Function to append cards to the grid
    function appendCards(cards) {
        if (cards.length === 0 && offset === 0) {
            cardGrid.innerHTML = '<p>No cards match the selected criteria.</p>';
            updateCardsCountMessage(0);
            return;
        }

        cards.forEach(card => {
            if (!card.card_images || card.card_images.length === 0) return;

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

        // Create and append the close button
        const closeButton = document.createElement('span');
        closeButton.id = 'card-modal-close';
        closeButton.className = 'modal-close-button';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        modalContent.appendChild(closeButton);

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
        rarityFilter.id = 'rarity-filter-modal';

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

        // Create and append the sets list with TCGPlayer links
        const packsList = document.createElement('ul');
        packsList.id = 'packs-list';
        card.card_sets.forEach(set => {
            const listItem = document.createElement('li');
            listItem.textContent = `${set.set_name} - Set-Code (${set.set_code}) - Rarity (${set.set_rarity})`;
            listItem.setAttribute('data-rarity', set.set_rarity);

            // Add TCGPlayer search link for the specific set
            const tcgLink = document.createElement('a');
            tcgLink.href = `https://www.tcgplayer.com/search/yugioh/product?ProductName=${encodeURIComponent(card.name)}`;
            tcgLink.target = '_blank';
            tcgLink.textContent = ' (Buy on TCGPlayer)';
            listItem.appendChild(tcgLink);

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

    // Function to filter packs by rarity in the modal
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

    // Add event listener to close the modal when clicking outside of it
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Add event listener to the search bar to filter cards by name with debounce
    if (searchBar) {
        let searchTimeout;
        searchBar.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearchTerm = searchBar.value.trim();
                localStorage.setItem('searchTerm', currentSearchTerm); // Save the search term

                offset = 0;

                if (currentSearchTerm) {
                    isSearching = true;
                    searchResults = []; // Clear previous search results
                    searchCards(currentSearchTerm);
                } else {
                    isSearching = false;
                    searchResults = [];
                    localStorage.removeItem('searchTerm'); // Remove the saved search term if search is cleared
                    cardGrid.innerHTML = ''; // Clear existing cards
                    fetchAndDisplayFilteredCards();
                }
            }, 300); // Delay of 300ms
        });
    }

    // Function to handle filter changes
    function onFilterChange() {
        offset = 0;
        if (currentSearchTerm) {
            isSearching = true;
            searchResults = []; // Clear previous search results
            searchCards(currentSearchTerm);
        } else {
            isSearching = false;
            cardGrid.innerHTML = ''; // Clear existing cards
            fetchAndDisplayFilteredCards();
        }
    }

    // Function to automatically set card type based on other filters
    function setCardTypeBasedOnFilters() {
        // If any monster-related filter has a selected value (not empty or 'all'), set card type to 'Monster'
        const monsterFilters = [
            monsterTypeFilter,
            monsterSubTypeFilter,
            monsterAbilityFilter,
            monsterRaceFilter,
            monsterAttributeFilter,
            monsterLevelFilter,
            monsterRankFilter,
            linkRatingFilter,
            pendulumScaleFilter
        ];

        const isMonsterFilterSelected = monsterFilters.some(filter => filter && filter.value && filter.value !== 'all' && filter.value !== '');

        if (isMonsterFilterSelected) {
            cardTypeFilter.value = 'Monster';
            return;
        }

        // If spell type filter has a selected value, set card type to 'Spell'
        if (spellTypeFilter && spellTypeFilter.value && spellTypeFilter.value !== 'all' && spellTypeFilter.value !== '') {
            cardTypeFilter.value = 'Spell';
            return;
        }

        // If trap type filter has a selected value, set card type to 'Trap'
        if (trapTypeFilter && trapTypeFilter.value && trapTypeFilter.value !== 'all' && trapTypeFilter.value !== '') {
            cardTypeFilter.value = 'Trap';
            return;
        }

        // If none of the above, do not change the card type filter
    }

    // Function to clear filters based on selected card type
    function clearFiltersBasedOnCardType(selectedCardType) {
        if (selectedCardType === 'Monster') {
            // Clear Spell and Trap filters
            if (spellTypeFilter) spellTypeFilter.selectedIndex = 0;
            if (trapTypeFilter) trapTypeFilter.selectedIndex = 0;
        } else if (selectedCardType === 'Spell') {
            // Clear Monster and Trap filters
            [
                monsterTypeFilter,
                monsterSubTypeFilter,
                monsterAbilityFilter,
                monsterRaceFilter,
                monsterAttributeFilter,
                monsterLevelFilter,
                monsterRankFilter,
                linkRatingFilter,
                pendulumScaleFilter,
                trapTypeFilter
            ].forEach(filter => {
                if (filter) filter.selectedIndex = 0;
            });
        } else if (selectedCardType === 'Trap') {
            // Clear Monster and Spell filters
            [
                monsterTypeFilter,
                monsterSubTypeFilter,
                monsterAbilityFilter,
                monsterRaceFilter,
                monsterAttributeFilter,
                monsterLevelFilter,
                monsterRankFilter,
                linkRatingFilter,
                pendulumScaleFilter,
                spellTypeFilter
            ].forEach(filter => {
                if (filter) filter.selectedIndex = 0;
            });
        }
    }

    // Add event listeners to all filters
    [
        rarityFilter,
        cardTypeFilter,
        monsterTypeFilter,
        monsterSubTypeFilter,
        monsterAbilityFilter,
        monsterRaceFilter,
        monsterAttributeFilter,
        monsterLevelFilter,
        monsterRankFilter,
        linkRatingFilter,
        pendulumScaleFilter,
        spellTypeFilter,
        trapTypeFilter
    ].forEach(filterElement => {
        if (filterElement) {
            filterElement.addEventListener('change', function () {
                // If the card type filter changed, clear irrelevant filters
                if (filterElement === cardTypeFilter) {
                    clearFiltersBasedOnCardType(cardTypeFilter.value);
                } else {
                    // Automatically set card type based on other filters
                    setCardTypeBasedOnFilters();
                }
                // Handle filter change
                onFilterChange();
            });
        }
    });

    // Add event listener to the reset filters button
    if (resetFiltersButton) {
        resetFiltersButton.addEventListener('click', function () {
            // Reset all filter values to their default
            [
                rarityFilter,
                cardTypeFilter,
                monsterTypeFilter,
                monsterSubTypeFilter,
                monsterAbilityFilter,
                monsterRaceFilter,
                monsterAttributeFilter,
                monsterLevelFilter,
                monsterRankFilter,
                linkRatingFilter,
                pendulumScaleFilter,
                spellTypeFilter,
                trapTypeFilter
            ].forEach(filterElement => {
                if (filterElement) {
                    filterElement.selectedIndex = 0; // Reset to first option
                }
            });

            // Clear search term
            if (searchBar) {
                searchBar.value = '';
                currentSearchTerm = '';
                localStorage.removeItem('searchTerm');
                isSearching = false;
                searchResults = [];
            }

            // Reset offset and fetch initial batch
            offset = 0;
            cardGrid.innerHTML = '';
            cardsCountMessage.textContent = '';
            fetchAndDisplayFilteredCards();
        });
    }

    // Function to update the cards count message
    function updateCardsCountMessage(count) {
        if (count === 0) {
            cardsCountMessage.textContent = 'No cards match the selected criteria.';
        } else {
            cardsCountMessage.textContent = `Showing ${count} card${count > 1 ? 's' : ''} matching the criteria.`;
        }
    }

    // Function to escape HTML to prevent XSS
    function escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Add an event listener for scrolling to implement lazy loading
    window.addEventListener('scroll', async () => {
        if (!isLoading && (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100)) {
            if (isSearching) {
                await searchCards(currentSearchTerm, offset);
            } else {
                await fetchAndDisplayFilteredCards();
            }
        }
    });
});
