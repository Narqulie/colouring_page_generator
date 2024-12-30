document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('img01');
    const captionText = document.getElementById('caption');
    const printBtn = document.querySelector('.print-btn');
    const closeModal = document.querySelector('.close');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    // Image click handler
    document.querySelector('.image-gallery').addEventListener('click', (e) => {
        const imageCard = e.target.closest('.image-card');
        
        if (imageCard && !e.target.classList.contains('delete-btn')) {
            const image = imageCard.querySelector('img');
            const caption = imageCard.querySelector('.image-info p').textContent;
            
            modal.style.display = 'block';
            modalImg.src = image.src;
            captionText.innerHTML = caption;
        }
    });

    // Delete button handler
    document.querySelector('.image-gallery').addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const imageCard = e.target.closest('.image-card');
            const filename = imageCard.dataset.filename;
            
            if (confirm('Are you sure you want to delete this image?')) {
                fetch(`/delete/${filename}`, { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            imageCard.remove();
                        } else {
                            alert('Failed to delete the image. Please try again.');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        alert('An error occurred while deleting the image.');
                    });
            }
        }
    });

    // Close button handler
    closeModal?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Print button handler
    printBtn?.addEventListener('click', () => {
        const newWindow = window.open('', '_blank');
        newWindow.document.write(`
            <html>
            <head>
                <title>Print</title>
                <style>
                    body { margin: 0; padding: 0; text-align: center; }
                    img { max-width: 100%; height: auto; }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                <img src="${modalImg.src}" />
            </body>
            </html>
        `);
        newWindow.document.close();
    });
});

document.querySelectorAll('button[type="submit"]').forEach(button => {
    button.addEventListener('mouseenter', function(event) {
        const rect = button.getBoundingClientRect();
        const transition = button.querySelector('.transition');

        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        transition.style.left = `${mouseX}px`;
        transition.style.top = `${mouseY}px`;
    });
});

function showErrorPopup(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorModal.style.display = 'block';

    // Close when clicking the close button
    const closeBtn = errorModal.querySelector('.close');
    closeBtn.onclick = () => {
        errorModal.style.display = 'none';
    };

    // Close when clicking outside the modal
    window.onclick = (event) => {
        if (event.target === errorModal) {
            errorModal.style.display = 'none';
        }
    };
}

// Add form validation
document.getElementById('generateForm').addEventListener('submit', (event) => {
    const prompt = document.getElementById('prompt').value.trim();
    if (!prompt) {
        event.preventDefault();
        showErrorPopup('Please enter a prompt before generating an image.');
        return false;
    }
});

flashMessage.fadeIn(500).delay(5000).fadeOut(500, function() {
    $(this).remove();
});

const generateForm = document.getElementById('generateForm');
const promptInput = document.getElementById('prompt');

promptInput.addEventListener('input', (event) => {
    const value = event.target.value.trim();
    const submitBtn = generateForm.querySelector('button[type="submit"]');
    
    if (value.length < 3) {
        promptInput.style.borderColor = '#ff4444';
        submitBtn.disabled = true;
    } else {
        promptInput.style.borderColor = '#ffaa5f';
        submitBtn.disabled = false;
    }
});

generateForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const prompt = promptInput.value.trim();
    
    if (!prompt || prompt.length < 3) {
        showErrorPopup('Please enter a prompt with at least 3 characters.');
        return;
    }

    showLoadingOverlay();

    try {
        const formData = new FormData(generateForm);
        const response = await fetch('/generate', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            window.location.href = '/';  // Redirect to home page
        } else {
            const data = await response.json();
            showErrorPopup(data.error || 'Failed to generate image');
        }
    } catch (error) {
        showErrorPopup('An error occurred while generating the image');
    } finally {
        hideLoadingOverlay();
    }
});
