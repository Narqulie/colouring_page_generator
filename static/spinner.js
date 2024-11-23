function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Add event listeners for form submissions
document.addEventListener('DOMContentLoaded', () => {
    const generateForm = document.getElementById('generateForm');
    const surpriseForm = document.getElementById('surpriseForm');

    generateForm?.addEventListener('submit', showLoadingOverlay);
    surpriseForm?.addEventListener('submit', showLoadingOverlay);
});