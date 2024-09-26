document.addEventListener('DOMContentLoaded', function () {
    const cardGrid = document.getElementById('card-grid');
    let page = 1; // Keep track of the current page for pagination
    const limit = 50; // Number of cards to fetch per request
    let fetching = false; // To prevent multiple fetches at the same time

    // Function to fetch cards from your MongoDB server
    async function fetchCards(page, limit) {
        try {
            const response = await fetch(`/api/cards?page=${page}&limit=${limit}`);
            const cards = await response.json();
            displayCards(cards);
        } catch (error) {
            console.error('Error fetching cards:', error);
        }
    }

    // Display cards in the grid
    function displayCards(cards) {
        // Populate the grid with the cards
        cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <img src="${card.card_images[0]?.image_url}" alt="${card.name}">
                <p>${card.name}</p>
            `;
            cardGrid.appendChild(cardElement);
        });
    }

    // Function to handle lazy loading when scrolling
    function handleScroll() {
        // Check if the user has scrolled near the bottom of the page
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 && !fetching) {
            fetching = true; // Set fetching to true to prevent multiple requests
            page++; // Increment the page number to fetch next set of cards
            fetchCards(page, limit).then(() => fetching = false);
        }
    }

    // Initialize the card viewer with the first page of cards
    fetchCards(page, limit);

    // Add scroll event listener for lazy loading
    window.addEventListener('scroll', handleScroll);
});
