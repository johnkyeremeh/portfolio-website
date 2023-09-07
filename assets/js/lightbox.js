document.addEventListener("DOMContentLoaded", function () {
    const galleryItems = document.querySelectorAll(".image-item");
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const closeButton = document.getElementById("close-button");
    const prevButton = document.getElementById("prev-button");
    const nextButton = document.getElementById("next-button");
    let currentIndex = 0;

    // Function to open the lightbox
    function openLightbox(index) {
        lightbox.style.display = "block";
        currentIndex = index;
        updateLightboxImage();
    }

    // Function to close the lightbox
    function closeLightbox() {
        lightbox.style.display = "none";
    }

    // Function to update the lightbox image
    function updateLightboxImage() {
        const originalImage = galleryItems[currentIndex].querySelector("img");
        lightboxImage.src = originalImage.src.replace("-small", ""); // Remove "-small" from the filename
    }

    // Event listeners for opening and closing the lightbox
    galleryItems.forEach((item, index) => {
        item.addEventListener("click", () => openLightbox(index));
    });

    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", closeLightbox);

    // Navigation buttons
    prevButton.addEventListener("click", () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateLightboxImage();
        }
    });

    nextButton.addEventListener("click", () => {
        if (currentIndex < galleryItems.length - 1) {
            currentIndex++;
            updateLightboxImage();
        }
    });

    // Keyboard navigation
    document.addEventListener("keydown", (event) => {
        if (lightbox.style.display === "block") {
            if (event.key === "Escape") {
                closeLightbox();
            } else if (event.key === "ArrowLeft") {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateLightboxImage();
                }
            } else if (event.key === "ArrowRight") {
                if (currentIndex < galleryItems.length - 1) {
                    currentIndex++;
                    updateLightboxImage();
                }
            }
        }
    });
});
