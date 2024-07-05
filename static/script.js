document.addEventListener('DOMContentLoaded', (event) => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('img01');
    const captionText = document.getElementById('caption');
    const images = document.querySelectorAll('.image-thumbnail');
    const printBtn = document.querySelector('.print-btn');
    const closeModal = document.getElementsByClassName('close')[0];

    images.forEach(image => {
        image.addEventListener('click', () => {
            modal.style.display = 'block';
            modalImg.src = image.src;
            captionText.innerHTML = image.alt;
        });
    });

    closeModal.onclick = function() { 
        modal.style.display = 'none';
    }

    printBtn.addEventListener('click', () => {
        // Hide elements that should not be printed
        document.querySelector('.button-container').style.display = 'none';
        captionText.style.display = 'none';


        // Restore hidden elements after printing
        document.querySelector('.button-container').style.display = 'block';
        captionText.style.display = 'block';
    });
});

document.querySelector('button[type="submit"]').addEventListener('mouseenter', function(event) {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const transition = button.querySelector('.transition');

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    transition.style.left = `${mouseX}px`;
    transition.style.top = `${mouseY}px`;
});

document.addEventListener('DOMContentLoaded', (event) => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('img01');
    const captionText = document.getElementById('caption');
    const images = document.querySelectorAll('.image-thumbnail');
    const printBtn = document.querySelector('.print-btn');
    const closeModal = document.getElementsByClassName('close')[0];

    images.forEach(image => {
        image.addEventListener('click', () => {
            modal.style.display = 'block';
            modalImg.src = image.src;
            captionText.innerHTML = image.alt;
        });
    });

    closeModal.onclick = function() { 
        modal.style.display = 'none';
    }

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
});
