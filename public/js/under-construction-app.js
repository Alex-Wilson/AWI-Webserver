// under-construction-app.js
document.addEventListener('DOMContentLoaded', function() {
    function runAnimation() {
        const typingElement = document.querySelector('.typing');
        const loadingBar = document.getElementById('loading-bar');
        const errorMessage = document.getElementById('error-message');
        const studyMessage = document.getElementById('study-message');
        
        // Reset initial states
        typingElement.style.width = '0';
        loadingBar.style.display = 'none';
        errorMessage.style.display = 'none';
        errorMessage.style.opacity = '0';
        studyMessage.style.display = 'none';
        
        // Start the typing animation
        typingElement.style.animation = 'none';
        typingElement.offsetHeight; /* trigger reflow */
        typingElement.style.animation = null;

        typingElement.addEventListener('animationend', function() {
            // Show the loading bar after typing animation
            loadingBar.style.display = 'block';

            let progress = 0;
            const loadingInterval = setInterval(() => {
                if (progress >= 100) {
                    clearInterval(loadingInterval);
                    loadingBar.textContent = '[====================] 100%';

                    // Show the "Access Denied" message after the loading bar completes
                    errorMessage.style.display = 'block';
                    setTimeout(() => {
                        errorMessage.style.opacity = '1';
                    }, 50); // Slight delay to trigger transition

                    // Show the "I am studying" message
                    setTimeout(() => {
                        studyMessage.style.display = 'block';
                    }, 2000); // Adjust timing to your preference

                } else {
                    progress += 5;
                    const filled = '='.repeat(progress / 5);
                    const empty = ' '.repeat(20 - progress / 5);
                    loadingBar.textContent = `[${filled}>${empty}] ${progress}%`;
                }
            }, 200); // Adjust the speed of the loading bar here
        }, { once: true });
    }

    runAnimation(); // Start the initial animation
});
