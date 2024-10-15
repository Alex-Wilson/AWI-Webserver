document.addEventListener('DOMContentLoaded', function () {
    // Get the search bar and card grid elements
    const searchBar = document.getElementById('search-bar');
    const cardGrid = document.getElementById('card-grid');
    const modal = document.getElementById('card-modal');
    const modalContent = document.getElementById('card-modal-content');
    const modalClose = document.getElementById('card-modal-close');

    // Check if card grid element exists
    if (!cardGrid) {
        console.error('Card grid element not found!'); // Log an error message if it doesn't exist
        return; // Stop running the script if the element is missing
    }

    let offset = 0; // Track the offset for pagination
    const cardsPerBatch = 50; // Number of cards to load per batch
    let isLoading = false; // Track if a fetch request is in progress
    let isSearching = false; // Track if a search is currently active
    let searchResults = []; // Store search results for lazy loading
    const searchLazyLoadLimit = 300; // Limit for search results before enabling lazy loading
    let currentSearchTerm = ''; // Track the current search term

    // Function to display a batch of cards in the card grid
    async function displayCardsBatch() {
        if (isLoading || isSearching) return; // Prevent multiple simultaneous fetches or general loading during a search

        try {
            isLoading = true;
            // Fetch the next batch of cards from the server
            const response = await fetch(`/api/cards?offset=${offset}&limit=${cardsPerBatch}`);
            const data = await response.json(); // Convert the response to JSON
            displayCards(data || []); // Display the cards using the fetched data
            offset += cardsPerBatch; // Increment the offset for the next batch
            isLoading = false;
        } catch (error) {
            console.error("Error occurred while fetching data:", error); // Log any errors that occur
            alert("An error occurred while fetching data. Please try again later."); // Show an alert to the user if something goes wrong
            isLoading = false;
        }
    }

    // Function to display the cards in the card grid
    function displayCards(cards) {
        // Clear the card grid before displaying cards
        cardGrid.innerHTML = '';
        // Loop through each card and create an element to display it
        cards.forEach(card => {
            card.card_images.forEach((image, index) => {
                const cardElement = document.createElement('div'); // Create a new div for the card
                cardElement.className = 'card'; // Add a class name to style the card

                // Set the inner HTML of the card element with the card's image
                cardElement.innerHTML = `
                    <img src="${image.image_url}" alt="${card.name} - Version ${index + 1}" class="card-image">
                    <p>${card.name} - Version ${index + 1}</p>
                `;

                // Add event listener for click effect to show larger image and set information
                cardElement.addEventListener('click', () => {
                    modalContent.innerHTML = `
                        <img src="${image.image_url}" alt="${card.name} - Version ${index + 1}" class="card-image-large">
                        <h2>${card.name} - Version ${index + 1}</h2>
                        <p>Sets: ${card.card_sets.map(set => set.set_name).join(', ')}</p>
                    `;
                    modal.style.display = 'block'; // Show the modal
                });

                // Add the card element to the card grid
                cardGrid.appendChild(cardElement);
            });
        });
    }

    // Add event listener to close the modal
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.style.display = 'none'; // Hide the modal
        });
    }

    // Add event listener to the search bar to filter cards by name
    if (searchBar) {
        searchBar.addEventListener('input', function () {
            currentSearchTerm = searchBar.value.trim().toLowerCase(); // Get the search term entered by the user
            if (currentSearchTerm) {
                isSearching = true; // Set searching state to true
                offset = 0; // Reset offset for new search
                searchCards(currentSearchTerm); // Perform the search
            } else {
                // If the search bar is cleared, reset to displaying all loaded cards
                isSearching = false; // Set searching state to false
                offset = 0; // Reset offset for pagination
                searchResults = []; // Clear search results to start fresh
                displayCardsBatch(); // Load the initial set of cards
            }
        });
    }

    // Function to search cards from the server
    async function searchCards(query, searchOffset = 0) {
        try {
            isLoading = true;
            // Fetch the search results from the server
            const response = await fetch(`/api/cards/search?term=${encodeURIComponent(query)}&offset=${searchOffset}&limit=${cardsPerBatch}`);
            const data = await response.json(); // Convert the response to JSON
            if (searchOffset === 0) {
                searchResults = data.cards || []; // Store initial search results
                if (searchResults.length > searchLazyLoadLimit) {
                    // Display the initial 300 search results and enable lazy loading for the rest
                    displayCards(searchResults.slice(0, 300));
                    offset = 300;
                } else {
                    // Display all search results if less than or equal to 300
                    displayCards(searchResults);
                    offset = searchResults.length;
                }
            } else {
                // Add new search results for lazy loading
                searchResults = searchResults.concat(data.cards || []);
                displayCards(searchResults.slice(0, offset + cardsPerBatch)); // Display current loaded search results
                offset += cardsPerBatch; // Increment the offset for the next batch
            }
            isLoading = false;
        } catch (error) {
            console.error("Error occurred while searching for cards:", error); // Log any errors that occur
            alert("An error occurred while searching for cards. Please try again later."); // Show an alert to the user if something goes wrong
            isLoading = false;
        }
    }

    // Display the initial 50 cards when the page loads
    displayCardsBatch();

    // Add an event listener for scrolling to implement lazy loading
    window.addEventListener('scroll', async () => {
        // Check if the user has scrolled near the bottom of the page
        if (!isLoading && (window.innerHeight + window.scrollY >= document.body.offsetHeight - 100)) {
            if (isSearching && searchResults.length > offset) {
                // Lazy load additional search results if applicable
                await searchCards(currentSearchTerm, offset);
            } else if (!isSearching) {
                // Load the next batch of cards if not currently searching
                await displayCardsBatch();
            }
        }
    });
});