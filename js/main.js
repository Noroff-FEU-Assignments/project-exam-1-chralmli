// Autoplay variables
let autoplayInterval;
const autoplaySpeed = 5000;
let currentIndex = 0;

document.addEventListener('DOMContentLoaded', function() {
    fetchBlogPosts();
    setupCarousel();
    startAutoplay();
});

// Fetch blog posts
async function fetchBlogPosts() {
    showLoadingIndicator();
    try {
        const response = await fetch('http://the-groove-grid.local/wp-json/wp/v2/posts?per_page=20');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const posts = await response.json();
        const mediaIds = posts.map(post => post.featured_media).filter(id => id !== 0)
        const images = await fetchImages(mediaIds);
        displayPosts(posts, images);

        hideLoadingIndicator();
    } catch (error) {
        console.error('Fetching error:', error.message);
        displayErrorMessage(error.message);
        hideLoadingIndicator();
    }
}

    // Show loading indicator while fetching data 
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
        loadingIndicator.style.display = "block";
    }
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
        loadingIndicator.style.display = "none";
    }
}

    // Fetch images
    async function fetchImages(mediaIds) {
        const requests = mediaIds.map(id =>
            fetch (`http://the-groove-grid.local/wp-json/wp/v2/media/${id}`)
        );
        const responses = await Promise.all(requests);
        const images = await Promise.all(responses.map(res => res.json()));
        return images.reduce((acc, image) => {
            acc[image.id] = image.source_url;
            return acc;
        }, {});
    }

    // Display posts in carousel
    function displayPosts(posts, images) {
        const carouselContent = document.querySelector(".carousel-content");
        posts.slice(0, 8).forEach(post => {
            const carouselItem = document.createElement("div");
            carouselItem.className = "carousel-item";

            if (post.featured_media && images[post.featured_media]) {
                let img = document.createElement("img");
                img.className = "carousel-img";
                img.src = images[post.featured_media];
                img.alt = "Featured Image";

                const imgLink = document.createElement("a");
                imgLink.href = `blog-post.html?post_id=${post.id}`;
                imgLink.appendChild(img);
                carouselItem.appendChild(imgLink);
            }

            const itemContent = document.createElement("div");
            itemContent.className = "carousel-item-content";
            itemContent.innerHTML = `
            <a href="blog-post.html?post_id=${post.id}" class="title-link">
                <h4>${post.title.rendered}</h4>
            </a>
            <span class="post-excerpt">${post.excerpt.rendered}</span>
            <a href="blog-post.html?post_id=${post.id}" class="read-more-btn">Read More</a>
            `;

            carouselItem.appendChild(itemContent);
            carouselContent.appendChild(carouselItem);
        })
    }

    // Move carousel in specific direction
    function moveCarousel(direction) {
        const totalItems = document.querySelectorAll(".carousel-item").length;
        const itemsPerSlide = window.innerWidth > 600 ? 4 : 1;
        const totalVisibleItems = Math.ceil(totalItems / itemsPerSlide);

        currentIndex += direction;

        if (currentIndex < 0) currentIndex = totalVisibleItems - 1;
        if (currentIndex >= totalVisibleItems) currentIndex = 0;

        const carouselContent = document.querySelector(".carousel-content");
        carouselContent.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    // Display user-friendly error messages
    function displayErrorMessage(message) {

    }

    // Setup carousel navigation and event listeners
    function setupCarousel() {
        document.querySelector(".prev-button").addEventListener("click", () => moveCarousel(-1));
        document.querySelector(".next-button").addEventListener("click", () => moveCarousel(1));

        // Event listeners for pausing/resuming autoplay
        const carousel = document.querySelector(".carousel");
        carousel.addEventListener("mouseover", pauseAutoplay);
        carousel.addEventListener("mouseout", startAutoplay);
    }

    // Start autoplay feature
    function startAutoplay() {
        clearInterval(autoplayInterval);
        autoplayInterval = setInterval(() => {
            moveCarousel(1);
        }, autoplaySpeed);
    }

    // Pause autoplay feature
    function pauseAutoplay() {
        clearInterval(autoplayInterval);
    }
