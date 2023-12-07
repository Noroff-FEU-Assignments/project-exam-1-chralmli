
// Exported variables
export let postContainer, heroSection, sidebar;
export let urlParams = new URLSearchParams(window.location.search);

// Event listener for DOM content loaded moved to main module

// Exported functions
export function initializeBlogPost() {
    postContainer = document.getElementById("post-container");
    heroSection = document.getElementById("hero-section");
    sidebar = document.querySelector(".post-sidebar");

    const postId = urlParams.get("post_id");
    if (postId) {
        // Function to fetch and display post
        // This function can be extracted to a shared module if similar functionality exists in 'blog.js'
    }
}

// Other functions can be defined and exported here if needed
