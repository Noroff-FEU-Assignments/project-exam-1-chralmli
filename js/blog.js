// Global variables
let currentPosts = [];
let currentPage = 1;
let categories = {};
let authors = {};
let totalPostsAvailable = 0;

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", function() {
    const postsGrid = document.getElementById("postsGrid");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const categoryFilter = document.getElementById("categoryFilter");
    const searchInput = document.getElementById("searchInput");

    // Initial fetch of posts and metadata
    fetchPosts();
    fetchCategories();
    fetchAuthors();

    // Event listeners for user interactions
    loadMoreBtn.addEventListener("click", () => {
        currentPage++;
        const selectedCategory = categoryFilter.value === "all" ? null : categoryFilter.value;
        fetchPosts(currentPage, selectedCategory);
    });

    categoryFilter.addEventListener("change", (event) => {
        currentPage = 1;
        currentPosts = [];
        const selectedCategory = event.target.value === "all" ? null : event.target.value;
        // filterPostsByCategory(event.target.value);
        fetchPosts(1, selectedCategory);
    });

    searchInput.addEventListener("input", (event) => {
        searchPosts(event.target.value);
    });
});

// Fetch posts from the wordpress REST API
async function fetchPosts(page = 1, categoryId = null) {
    showLoadingIndicator();
    let url = `https://christianalmli.no/wp-json/wp/v2/posts?page=${page}&per_page=10`;
    if (categoryId) {
        url += `&categories=${categoryId}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        totalPostsAvailable = parseInt(response.headers.get("X-WP-Total"));
        
        const newPosts = await response.json();
        currentPosts = [...currentPosts, ...newPosts];

        // Process media IDs to fetch images
        const mediaIds = newPosts.map(post => post.featured_media).filter(id => id !== 0);
        if (mediaIds.length > 0) {
            const images = await fetchImages(mediaIds);
            newPosts.forEach(post => {
                if (post.featured_media) {
                    post.image_url = images[post.featured_media] || "";
                }
            });
        }

        displayPosts(currentPosts);

        // Update loadMoreBtn visibility
        updateLoadMoreBtnVisibility();

        // Update DOM with new posts
        hideLoadingIndicator();
    } catch (error) {
        console.error("Error fetching posts:", error);
        hideLoadingIndicator();
    }
}

function updateLoadMoreBtnVisibility() {
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    if (currentPosts.length < totalPostsAvailable) {
        loadMoreBtn.style.display = "block";
    } else {
        loadMoreBtn.style.display = "none";
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

// Fetch featured images for posts
async function fetchImages(mediaIds) {
    const requests = mediaIds.map(id => fetch(`https://christianalmli.no/wp-json/wp/v2/media/${id}`));
    const responses = await Promise.all(requests);
    const images = await Promise.all(responses.map(res => res.json()));
    return images.reduce((acc, image) => {
        acc[image.id] = image.source_url;
        return acc;
    }, {});
}

// fetch categories and update the category filter dropdown
async function fetchCategories() {
    try {
        const response = await fetch("https://christianalmli.no/wp-json/wp/v2/categories");
        if (!response.ok) {
            throw new Error (`HTTP error! Status: ${response.status}`);
        } 
        const categoriesData = await response.json();
        categories = categoriesData.reduce((acc, category) => {
            acc[category.id] = category.name;
            return acc;
        }, {});

        populateCategoryFilter();
    } catch (error) {
        console.error("Error fetching categories:", error);
    }
}

// Populate the category filter dropdown with category options
function populateCategoryFilter() {
    const categoryFilter = document.getElementById("categoryFilter");

    let allCategoriesOption = `<option value="all">All Categories</option>`;

    categoryFilter.innerHTML = allCategoriesOption + Object.entries(categories).map(([id, name]) => 
    `<option value="${id}">${name}</option>`
    ).join("");
}

// Fetch authors data
async function fetchAuthors() {
    try {
        const response = await fetch("https://christianalmli.no/wp-json/wp/v2/users");
        const authorsData = await response.json();
        authors = authorsData.reduce((acc, author) => {
            acc[author.id] = author.name;
            return acc;
        }, {});
    } catch (error) {
        console.error("Error fetching authors:", error);
    }
}

// Display posts
function displayPosts(posts) {
    const postsGrid = document.getElementById("postsGrid");
    postsGrid.innerHTML = posts.map(post => {
        const categoryName = post.categories.map(id => categories[id]).join(", ");
        const authorName = authors[post.author] || "Unknown Author";

        const categoryAndAuthor = `${categoryName} | ${authorName}`;
        return `
    <div class="posts-grid-item">
        <div class="post-image-container">
        ${post.image_url ? `<img src="${post.image_url}" alt="${post.title.rendered}">` : ""}
        </div>
        <div class="posts-grid-content">
            <a class="post-title-link" href="blog-post.html?post_id=${post.id}"<h3>${post.title.rendered}</h3></a>
            <p class="posts-author-category">${categoryAndAuthor}</p>
            <p class="posts-excerpt">${post.excerpt.rendered}</p>
            <a class="read-more-btn" href="blog-post.html?post_id=${post.id}">Read More</a>
        </div>
    </div>
    `;
    }).join("");
}

// Filter posts by selected category
async function filterPostsByCategory(categoryId) {
    // Show all posts if "all" is selected
    if (categoryId === "all") {
        currentPage = 1;
        currentPosts = [];
        fetchPosts();
        return;
    }

    showLoadingIndicator();

    // Fetch posts filtered by category
    try {
        const url = `https://christianalmli.no/wp-json/wp/v2/posts?categories=${categoryId}&per_page=10`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const filteredPosts = await response.json();

        // Check if there are more posts to load
        updateLoadMoreBtn(response.headers);

        // Fetch images for filtered posts
        const mediaIds = filteredPosts.map(post => post.featured_media).filter(id => id !== 0);
        let images = {};
        if (mediaIds.length > 0) {
            images = await fetchImages(mediaIds);
        }

        // Assign images to posts and display
        filteredPosts.forEach(post => {
            post.image_url = images[post.featured_media] || "";
        });
        currentPosts = filteredPosts;
        displayPosts(currentPosts);

        hideLoadingIndicator();
    } catch (error) {
        console.error("Error fetching filtered posts:", error);
        hideLoadingIndicator();
    }   
}

function updateLoadMoreBtn(headers) {
    const totalPosts = headers.get("X-WP-Total");
    const totalPages = headers.get("X-WP-TotalPages");
    if (currentPage >= totalPages || currentPosts.length >= totalPosts) {
        document.getElementById("loadMoreBtn").style.display = "none";
    } else {
        document.getElementById("loadMoreBtn").style.display = "block";
    }
}

// Search posts based on user input
function searchPosts(searchTerm) {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const filteredPosts = currentPosts.filter(post => post.title.rendered.toLowerCase().includes(lowerCaseSearchTerm));
    displayPosts(filteredPosts);
}