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
        fetchPosts(1, selectedCategory);
    });

    searchInput.addEventListener("input", (event) => {
        searchPosts(event.target.value);
    });
});

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data from ${url}:`, error);
        handleError(error);
        return null;
    }
}

function handleError(error) {
    console.error("An error occurred:", error);
    // Implement user-friendly error message
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = "An error occurred. Please try again later.";
}

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

        if (!newPosts) {
            hideLoadingIndicator();
            return;
        }
            
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
    } catch (error) {
        hideLoadingIndicator();
        handleError();
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
    const categoriesData = await fetchData("https://christianalmli.no/wp-json/wp/v2/categories");
    if (!categoriesData) return;

        categories = categoriesData.reduce((acc, category) => {
            acc[category.id] = category.name;
            return acc;
        }, {});

        populateCategoryFilter();
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
    const authorsData = await fetchData("https://christianalmli.no/wp-json/wp/v2/users");
    if (!authorsData) return;

        authors = authorsData.reduce((acc, author) => {
            acc[author.id] = author.name;
            return acc;
        }, {});
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
        ${post.image_url ? `<img src="${post.image_url}" loading="lazy" alt="${post.title.rendered}">` : ""}
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
        handleError();
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

// Search posts based on user input and show suggestions
async function searchPosts(searchTerm) {
    const normalizedSearchTerm = searchTerm.toLowerCase();
    const suggestionsDropdown = document.getElementById("searchSuggestions");

    if (normalizedSearchTerm) {
        // Fetch posts based on search term
        const searchResults = await fetchPostsBySearchTerm(normalizedSearchTerm);

        // Compile suggestions for titles and categories
        const titleSuggestions = getSuggestionsByTitle(searchResults, normalizedSearchTerm);
        const categorySuggestions = getSuggestionsByCategory(categories, normalizedSearchTerm);

        // Populate and display suggestions in the dropdown
        populateSuggestionsDropdown(suggestionsDropdown, titleSuggestions, "post");
        populateSuggestionsDropdown(suggestionsDropdown, categorySuggestions, "category");

        toggleDropdownDisplay(suggestionsDropdown, titleSuggestions, categorySuggestions);
    } else {
        // Reset suggestions
        resetSuggestions(suggestionsDropdown);
        displayPosts(currentPosts);
    }
}

async function fetchPostsBySearchTerm(searchTerm) {
    const url = `https://christianalmli.no/wp-json/wp/v2/posts?search=${encodeURIComponent(searchTerm)}&per_page=10`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching posts for search term "${searchTerm}":`, error);
        handleError();
        return [];
    }
}

function resetSuggestions(dropdown) {
    dropdown.innerHTML = "";
    dropdown.style.display = "none";
}

function getSuggestionsByTitle(posts, searchTerm) {
    return posts.filter(post =>
        post.title.rendered.toLowerCase().includes(searchTerm)
        ).slice(0, 5);
}

function getSuggestionsByCategory(categoryObj, searchTerm) {
    return Object.entries(categoryObj)
        .filter(([_, name]) => name.toLowerCase().includes(searchTerm))
        .slice(0, 5);
}

function populateSuggestionsDropdown(dropdown, suggestions, type) {
    suggestions.forEach(suggestion => {
        const element = document.createElement("p");
        element.textContent = type === "post" ? suggestion.title.rendered : `Category: ${suggestion[1]}`;
        element.addEventListener("click", () => {
            if (type === "post") {
                displayPosts([suggestion]);
            } else {
                const categoryId = suggestion[0];
                displayPosts(currentPosts.filter(post => post.categories.includes(Number(categoryId))));
            }
            dropdown.style.display = "none";
        });
        dropdown.appendChild(element);
    });
}

function toggleDropdownDisplay(dropdown, titleSuggestions, categorySuggestions) {
    if (titleSuggestions.length > 0 || categorySuggestions.length > 0) {
        dropdown.style.display = "block";
    }
}

document.addEventListener("click", function(event) {
    const searchInput = document.getElementById("searchInput");
    const searchSuggestions = document.getElementById("searchSuggestions");

    if (!searchInput.contains(event.target) && !searchSuggestions.contains(event.target)) {
        resetSuggestions(searchSuggestions);
    }
});

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("click", function(event) {
    event.stopPropagation();
});

searchSuggestions.addEventListener("click", function(event) {
    event.stopPropagation();
})

// Call searchPosts when backspace is pressed and input becomes empty
searchInput.addEventListener("keyup", function(event) {
    if (event.key === "Backspace") {
        searchPosts(this.value);
    }
});

searchInput.addEventListener("input", function(event) {
    searchPosts(this.value);
});