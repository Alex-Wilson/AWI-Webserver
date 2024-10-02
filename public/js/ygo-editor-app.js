document.addEventListener('DOMContentLoaded', function () {
    const cardGrid = document.getElementById('card-grid');
    const searchBar = document.getElementById('search-bar');
    let displayedCards = []; // Store only currently displayed cards
    let displayedCardIds = new Set(); // Track unique card IDs to avoid duplicates
    let offset = 0; // Track offset for pagination
    const cardsPerBatch = 100; // Load 100 cards at a time
    let isLoading = false; // Track if a fetch request is in progress
    let isSearching = false; // Track if a search is active
    let currentSearchTerm = ''; // Store the current search term

    // Accessibility - Focus on card grid when content updates (called only during scroll events)
    function focusOnCardGrid() {
        cardGrid.setAttribute('tabindex', '-1'); // Make cardGrid focusable temporarily
        cardGrid.focus();
    }

    // Fetch a batch of cards from your API in alphabetical order
    async function fetchCardsBatch(offset = 0, limit = cardsPerBatch) {
        if (isLoading) return; // Prevent multiple simultaneous fetches

        // Log when the initial fetch happens
        if (offset === 0) {
            console.log('Initial fetch of cards happening.');
        }

        try {
            isLoading = true;

            // Fetch the cards from the API
            const response = await fetch(`/api/cards?offset=${offset}&limit=${limit}`);
            const data = await response.json();

            // Log API response to verify data structure
            console.log('API Response:', data);

            if (data && data.length > 0) {
                // Display only unique cards
                const uniqueNewCards = data.filter(card => !displayedCardIds.has(card.id));
                displayCards(uniqueNewCards);
                
                // Increment the offset after successful fetch
                offset += limit;
            } else {
                console.log('No cards found in the response.');
            }

            isLoading = false;

            // Focus on the card grid only during scrolling or initial page load
            if (!isSearching) {
                focusOnCardGrid();
            }
        } catch (error) {
            console.error('Error fetching cards:', error);
            isLoading = false;
        }
    }

    // Fetch cards by search term from your API
    async function fetchCardsBySearchTerm(searchTerm, offset = 0, limit = cardsPerBatch) {
        if (isLoading) return []; // Prevent multiple simultaneous fetches
        try {
            isLoading = true;
            const response = await fetch(`/api/cards/search?term=${encodeURIComponent(searchTerm)}&offset=${offset}&limit=${limit}`);
            const data = await response.json();
            isLoading = false;
            return data.cards || [];
        } catch (error) {
            console.error('Error fetching cards:', error);
            isLoading = false;
            return [];
        }
    }

    // Display cards in the grid
    function displayCards(cards) {
        console.log('Displaying cards:', cards); // Log cards to be displayed

        // Add only unique cards to the grid and track their IDs
        cards.forEach(card => {
            if (!displayedCardIds.has(card.id)) {
                displayedCardIds.add(card.id);

                card.card_images.slice(0, 1).forEach(image => { // Show one printing
                    const cardElement = document.createElement('div');
                    cardElement.className = 'card';
                    cardElement.setAttribute('role', 'button'); // Make cards keyboard focusable
                    cardElement.setAttribute('tabindex', '0'); // Make cards keyboard focusable
                    cardElement.innerHTML = `
                        <img src="${image.image_url}" alt="${card.name}" aria-label="${card.name}">
                        <p>${card.name}</p>
                    `;
                    cardGrid.appendChild(cardElement);
                });
            }
        });

        // Update the displayed cards array
        displayedCards = displayedCards.concat(cards);
    }

    // Search local cards
    function searchLocalCards(searchTerm) {
        searchTerm = searchTerm.trim().toLowerCase();
        return displayedCards.filter(card => fuzzyMatch(card.name.toLowerCase(), searchTerm));
    }

    // Fuzzy search function
    function fuzzyMatch(cardName, searchTerm) {
        const cardNameChars = cardName.split('');
        const searchTermChars = searchTerm.split('');
        
        let index = 0;
        for (const char of searchTermChars) {
            index = cardNameChars.indexOf(char, index);
            if (index === -1) return false;
            index++;
        }
        return true;
    }

    // Search functionality
    searchBar.addEventListener('input', async function () {
        currentSearchTerm = searchBar.value.trim().toLowerCase();

        // If there's an active search term, enable searching mode
        if (currentSearchTerm) {
            isSearching = true;
            offset = 0; // Reset offset for search pagination
            displayedCardIds.clear(); // Clear displayed card IDs for new search
            displayedCards = []; // Clear the displayed cards array to avoid duplication
            cardGrid.innerHTML = ''; // Clear the grid for new results

            // Perform a local search first
            let results = searchLocalCards(currentSearchTerm);
            displayCards(results);

            // If not enough results and we are searching, fetch more cards based on the search term
            if (results.length < 10) {
                const newCards = await fetchCardsBySearchTerm(currentSearchTerm, offset, cardsPerBatch);
                results = results.concat(newCards);
                displayCards(results);
            }
        } else {
            // If search term is cleared, reset to normal loading
            isSearching = false;
            cardGrid.innerHTML = ''; // Clear the grid
            displayedCardIds.clear(); // Clear displayed card IDs
            displayedCards = []; // Clear displayed cards array
            offset = 0; // Reset offset
            fetchCardsBatch(offset, cardsPerBatch); // Load the initial set of cards
        }
    });

    // Lazy loading: Load more cards when the user scrolls to the bottom
    window.addEventListener('scroll', async () => {
        // Check if the user has scrolled near the bottom
        if (!isLoading && (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100)) {
            if (isSearching && currentSearchTerm) {
                // Fetch more cards related to the search term
                const newCards = await fetchCardsBySearchTerm(currentSearchTerm, offset, cardsPerBatch);
                
                // Update offset for pagination
                offset += cardsPerBatch; 
                
                // If new cards are found, display them
                const uniqueNewCards = newCards.filter(card => !displayedCardIds.has(card.id));
                if (uniqueNewCards.length > 0) {
                    displayCards(uniqueNewCards);
                }
            } else {
                // Fetch the next batch of cards if not currently searching
                fetchCardsBatch(offset, cardsPerBatch);
                offset += cardsPerBatch; // Increment the offset for pagination
            }
        }
    });

    // Keyboard navigation for accessibility
    cardGrid.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            const focusedElement = document.activeElement;
            if (focusedElement.classList.contains('card')) {
                // Handle card selection or any action you want to perform on Enter/Space
                console.log(`Card selected: ${focusedElement.textContent}`);
            }
        }
    });

    // Initialize the card viewer with the first 100 cards
    fetchCardsBatch(offset, cardsPerBatch);
});



// @TODO:
// 1. Optimize search functionality to reduce latency.
// 2. ???Implement debounce for search input to limit API calls.
// 3. Cache search results to avoid redundant API requests.
// 4. Improve error handling and user feedback for failed fetch requests.
// 5. Add loading indicators for better user experience during data fetch.
// 6. Refactor code to separate concerns and improve readability.
// 7. Have an html element to indicate the number of cards that are being returned/fetched.
// 8. Add a filter option for each of the card properties.
// 9. Add a sort option for each of the card properties.
// 10. Add a way to reset the search and filters.