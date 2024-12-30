function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = 'flex';
    
    // Add progress dots animation
    const loaderText = overlay.querySelector('.loader-text');
    let dots = 0;
    const interval = setInterval(() => {
        dots = (dots + 1) % 4;
        loaderText.textContent = `Generating your image${'.'.repeat(dots)}`;
    }, 500);
    
    // Store interval ID for cleanup
    overlay.dataset.intervalId = interval;
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay.dataset.intervalId) {
        clearInterval(parseInt(overlay.dataset.intervalId));
    }
    overlay.style.display = 'none';
}

// Add event listeners for form submissions and page load
document.addEventListener('DOMContentLoaded', () => {
    const generateForm = document.getElementById('generateForm');
    const surpriseForm = document.getElementById('surpriseForm');
    const overlay = document.getElementById('loadingOverlay');

    // Hide overlay on initial page load
    hideLoadingOverlay();

    // Add form submission listeners
    if (generateForm) {
        generateForm.addEventListener('submit', showLoadingOverlay);
    }
    if (surpriseForm) {
        surpriseForm.addEventListener('submit', showLoadingOverlay);
    }

    // Add flash message handling
    function showFlashMessage(message, category) {
        const container = document.getElementById('flash-messages-container');
        const flashDiv = document.createElement('div');
        flashDiv.className = `flash-message alert alert-${category}`;
        flashDiv.textContent = message;
        
        // Add fade-in effect
        flashDiv.style.opacity = '0';
        container.appendChild(flashDiv);
        
        // Trigger reflow
        flashDiv.offsetHeight;
        
        // Add transition
        flashDiv.style.transition = 'opacity 0.5s ease-in-out';
        flashDiv.style.opacity = '1';
        
        // Remove after delay
        setTimeout(() => {
            flashDiv.style.opacity = '0';
            setTimeout(() => {
                flashDiv.remove();
            }, 500);
        }, 3000);
    }

    // Expose flash message function globally
    window.showFlashMessage = showFlashMessage;
});

// Add window load handler
window.addEventListener('load', hideLoadingOverlay);