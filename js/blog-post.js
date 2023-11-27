
let postContainer, heroSection, sidebar, categoriesDiv;
let urlParams = new URLSearchParams(window.location.search);
document.addEventListener("DOMContentLoaded", async function() {
    postContainer = document.getElementById("post-container");
    heroSection = document.getElementById("hero-section");
    sidebar = document.querySelector(".post-sidebar");
    categoriesDiv = document.querySelector(".categories");


    const postId = urlParams.get("post_id");
    postId ? await fetchAndDisplayPost(postId) : "";
    fetchCategories().catch(handleError);
});

function showLoadingIndicator() {
    const loadingIndicator = document.getElementById("loading-indicator");
    loadingIndicator.style.display = "block";
}

function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById("loading-indicator");
    loadingIndicator.style.display = "none";
}

async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}

async function fetchAndDisplayPost(postId) {
    try {
        showLoadingIndicator();
        const post = await fetchData(`http://the-groove-grid.local/wp-json/wp/v2/posts/${postId}`);
        updateDOMForPost(post);
        // Fetch related posts if categories are available
        if (post.categories.length > 0) {
            fetchRelatedPosts(post.categories[0], postId).catch(handleError);
        }
    } catch (error) {
        handleError(error);
    }
}


function decodeHtmlEntities(text) {
    let textArea = document.createElement("textarea");
    textArea.innerHTML = text;
    return textArea.textContent;
}

// Update the DOM with the post's content
async function updateDOMForPost(post) {
    // Clear existing content
    postContainer.innerHTML = "";
    heroSection.innerHTML = "";

    // Decoding title
    const decodedTitle = decodeHtmlEntities(post.title.rendered);
    document.title = `The Groove Grid | ${decodedTitle}`;

    // Set hero image and title
    if (post.featured_media) {
        setHeroImageAndTitle(post.featured_media, decodedTitle);
    }

    const content = document.createElement("div");
    content.innerHTML = post.content.rendered;
    postContainer.appendChild(content);

    // Fetch and display comments
    const comments = await fetchComments(post.id);
    displayComments(comments);
    hideLoadingIndicator();
}

async function setHeroImageAndTitle(mediaId, titleText) {
    try {
        const image = await fetchData(`http://the-groove-grid.local/wp-json/wp/v2/media/${mediaId}`);
        // DOM updates for hero image and title
        const heroSection = document.getElementById("hero-section");
        heroSection.style.backgroundImage = `url(${image.source_url})`;

        const title = document.createElement("h1");
        title.textContent = titleText;
        title.className = "post-title";
        heroSection.appendChild(title);
    } catch (error) {
        handleError(error);
    }
}

async function fetchComments(postId) {
    try {
        const response = await fetch(`http://the-groove-grid.local/wp-json/wp/v2/comments?post=${postId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching comments:", error);
    }
}

function displayComments(comments) {
    if (!comments || comments.length === 0) return;

    const commentsSection = document.createElement("div");
    commentsSection.className = "comment-section";

    let commentsHTML = "<h3>Comments</h3>";
    comments.forEach(comment => {
        commentsHTML += `
        <div class="comment">
            <p class="comment-author">${comment.author_name}: ${comment.content.rendered}</p>
        </div>
        `;
    });
    
    commentsSection.innerHTML = commentsHTML;
    postContainer.appendChild(commentsSection);
}

async function fetchRelatedPosts(categoryId, currentPostId) {
    try {
        const posts = await fetchData(`http://the-groove-grid.local/wp-json/wp/v2/posts?categories=${categoryId}&per_page=100`);
        const relatedPosts = posts.filter(post => post.id.toString() !== currentPostId.toString());
        displayRelatedPosts(relatedPosts);
    } catch (error) {
        handleError(error);
    }
}

function displayRelatedPosts(posts) {
    // DOM updates for related posts
    const existingRelatedPosts = sidebar.querySelector(".related-posts");
    if (existingRelatedPosts) {
        existingRelatedPosts.remove();
    }

    // Create new div for related posts
    const relatedPostsDiv = document.createElement("div");
    relatedPostsDiv.className = "related-posts";
    let html = "<h3>Related Posts</h3><ul>";

    posts.forEach(post => {
        html += `<li><a href="#" onclick="loadPost(${post.id}, event)">${post.title.rendered}</a></li>`;
    });

    html += "</ul>";
    relatedPostsDiv.innerHTML = html;
    sidebar.appendChild(relatedPostsDiv);
}

async function loadPost(postId, event) {
    event.preventDefault();
    showLoadingIndicator();
    await fetchAndDisplayPost(postId.toString(), event);
    window.history.pushState({}, "", `blog-post.html?post_id=${postId}`);
}

async function fetchCategories() {
    try {
        const categories = await fetchData(`http://the-groove-grid.local/wp-json/wp/v2/categories`);
        displayCategories(categories);
    } catch (error) {
        handleError(error);
    }
}

function displayCategories(categories) {
    // DOM updates for categories
    const categoriesDiv = document.querySelector(".categories");
    let html = "<h3>Categories</h3><ul>";

    categories.forEach(category => {
        html += `<li><a href="blog.html?category_id=${category.id}" onclick="filterPostsByCategory(${category.id}, event)">${category.name}</a></li>`;
    });

    html += "</ul>";
    categoriesDiv.innerHTML = html;
}

async function filterPostsByCategory(categoryId, event) {
    event.preventDefault();
    // Functionality for filtering posts
    try {
        const posts = await fetchData(`http://the-groove-grid.local/wp-json/wp/v2/posts?categories=${categoryId}`);
        updatePostsForCategory(posts);
    } catch (error) {
        handleError(error);
    }
    console.log(`Filtering posts by category: ${categoryId}`);
}

function updatePostsForCategory(posts) {

}

function handleError(error) {
    console.error("An error occurred:", error);
    // Implement user-friendly error message
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = "An error occurred. Please try again later.";
}

document.getElementById("commentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const postId = urlParams.get("post_id");
    const authorName = document.getElementById("commentAuthor").value;
    const authorEmail = document.getElementById("commentEmail").value;
    const commentContent = document.getElementById("commentText").value;

    const commentData = {
        post: postId,
        author_name: authorName,
        author_email: authorEmail,
        content: commentContent
    };

    try {
        await postComment(commentData);
        alert("Comment submitted successfully!");
    } catch (error) {
        console.error("Error posting comment:", error);
        alert("Failed to submit comment.");
    }
});

async function postComment(commentData) {
    const response = await fetch(`http://the-groove-grid.local/wp-json/wp/v2/comments`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        // Add authentication headers if required
    },
    body: JSON.stringify(commentData)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}