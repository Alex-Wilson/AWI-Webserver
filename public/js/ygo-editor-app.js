document.addEventListener('DOMContentLoaded', function () {
    // Get the search bar and card grid elements
    const searchBar = document.getElementById('search-bar');
    const cardGrid = document.getElementById('card-grid');
    const modal = document.getElementById('card-modal');
    const modalContent = document.getElementById('card-modal-content');
    const modalClose = document.getElementById('card-modal-close');

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
            displayCards(data || []);
            offset += cardsPerBatch;
            isLoading = false;
        } catch (error) {
            console.error("Error occurred while fetching data:", error);
            alert("An error occurred while fetching data. Please try again later.");
            isLoading = false;
        }
    }

    // Function to display the cards in the card grid
    function displayCards(cards) {
        cardGrid.innerHTML = '';
        cards.forEach(card => {
            card.card_images.forEach((image, index) => {
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.innerHTML = `
                    <img src="${image.image_url}" alt="${card.name} - Version ${index + 1}" class="card-image">
                    <p>${card.name} - Version ${index + 1}</p>
                `;
                cardElement.addEventListener('click', () => {
                    modalContent.innerHTML = `
                        <img src="${image.image_url}" alt="${card.name} - Version ${index + 1}" class="card-image-large">
                        <h2>${card.name} - Version ${index + 1}</h2>
                        <p>Sets: ${card.card_sets.map(set => set.set_name).join(', ')}</p>
                    `;
                    modal.style.display = 'block';
                });
                cardGrid.appendChild(cardElement);
            });
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
                searchCards(currentSearchTerm);
            } else {
                isSearching = false;
                offset = 0;
                searchResults = [];
                localStorage.removeItem('searchTerm'); // Remove the saved search term if search is cleared
                displayCardsBatch();
            }
        });
    }

    // Function to search cards from the server
    async function searchCards(query, searchOffset = 0) {
        try {
            isLoading = true;
            const response = await fetch(`/api/cards/search?term=${encodeURIComponent(query)}&offset=${searchOffset}&limit=${cardsPerBatch}`);
            const data = await response.json();

            if (searchOffset === 0) {
                searchResults = data.cards || [];
                if (searchResults.length > searchLazyLoadLimit) {
                    displayCards(searchResults.slice(0, 300));
                    offset = 300;
                } else {
                    displayCards(searchResults);
                    offset = searchResults.length;
                }
            } else {
                searchResults = searchResults.concat(data.cards || []);
                displayCards(searchResults.slice(0, offset + cardsPerBatch));
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
});