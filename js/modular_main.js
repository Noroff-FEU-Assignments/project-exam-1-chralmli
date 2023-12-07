
// Exported variables
let autoplayInterval;
const autoplaySpeed = 5000;
let currentIndex = 0;

// Importing necessary functions from other modules
import { initializeBlog } from './modular_blog.js';
import { initializeBlogPost } from './modular_blog_post.js';

// Event listener for DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeBlog(); // Initialize blog functionality
    initializeBlogPost(); // Initialize blog post functionality
    fetchBlogPosts();
    setupCarousel();
    startAutoplay();
});

// Exported functions
export async function fetchBlogPosts() {
    showLoadingIndicator();
    try {
        const response = await fetch('https://christianalmli.no/wp-json/wp/v2/posts?per_page=20');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // Process response...
    } catch (error) {
        // Handle error...
    }
}

export function setupCarousel() {
    // Carousel setup code...
}

export function startAutoplay() {
    // Autoplay functionality...
}

// Other functions can be defined and exported here if needed
