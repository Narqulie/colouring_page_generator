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
    clearInterval(overlay.dataset.intervalId);
    overlay.style.display = 'none';
}

// Add event listeners for form submissions
document.addEventListener('DOMContentLoaded', () => {
    const generateForm = document.getElementById('generateForm');
    const surpriseForm = document.getElementById('surpriseForm');

    generateForm?.addEventListener('submit', showLoadingOverlay);
    surpriseForm?.addEventListener('submit', showLoadingOverlay);
});