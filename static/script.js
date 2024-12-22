document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('img01');
    const captionText = document.getElementById('caption');
    const images = document.querySelectorAll('.image-thumbnail');
    const printBtn = document.querySelector('.print-btn');
    const closeModal = document.querySelectorAll('.close');
    const deleteButtons = document.querySelectorAll('.delete-btn');

    images.forEach(image => {
        image.addEventListener('click', () => {
            modal.style.display = 'block';
            modalImg.src = image.src;
            captionText.innerHTML = image.alt;
        });
    });

    closeModal.forEach(close => {
        close.onclick = () => { 
            modal.style.display = 'none';
        };
    });

    printBtn.addEventListener('click', () => {
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

    deleteButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            event.preventDefault();
            const imageCard = button.closest('.image-card');
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
        });
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

generateForm.addEventListener('submit', (event) => {
    const prompt = promptInput.value.trim();
    if (!prompt || prompt.length < 3) {
        event.preventDefault();
        showErrorPopup('Please enter a prompt with at least 3 characters.');
        return false;
    }
});
