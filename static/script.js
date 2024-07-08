document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('img01');
    const captionText = document.getElementById('caption');
    const images = document.querySelectorAll('.image-thumbnail');
    const printBtn = document.querySelector('.print-btn');
    const closeModal = document.querySelectorAll('.close');

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