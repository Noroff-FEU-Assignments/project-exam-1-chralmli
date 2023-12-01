
// Global variables
let postContainer, heroSection, sidebar;
let urlParams = new URLSearchParams(window.location.search);

// Initialize the page
document.addEventListener("DOMContentLoaded", async function() {
    postContainer = document.getElementById("post-container");
    heroSection = document.getElementById("hero-section");
    sidebar = document.querySelector(".post-sidebar");


    const postId = urlParams.get("post_id");
    if (postId) {
        await fetchAndDisplayPost(postId);
    }
});

// Fetch and display post
async function fetchAndDisplayPost(postId) {
    try {
        showLoadingIndicator();
        clearContent();

        const post = await fetchData(`https://christianalmli.no/wp-json/wp/v2/posts/${postId}`);
        updateTitle(post.title.rendered);
        if (post.featured_media) {
            await setHeroImageAndTitle(post.featured_media, post.title.rendered);
        }
        addPostContent(post.content.rendered);

        // Fetch related posts if categories are available
        if (post.categories.length > 0) {
            fetchRelatedPosts(post.categories[0], postId)
        }

        // fetch comments
        const comments = await fetchComments(post.id);
        displayComments(comments);

    } catch (error) {
        handleError(error);
        clearContent();
        return;
    } finally {
        hideLoadingIndicator();
    }
}

// Utility functions
function showLoadingIndicator() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    loadingIndicator.style.display = "block";
}
function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    loadingIndicator.style.display = "none";
}
async function fetchData(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
}
function handleError(error) {
    console.error("An error occurred:", error);
    // Implement user-friendly error message
    const errorElement = document.getElementById("error-message");
    errorElement.textContent = "An error occurred. Please try again later.";
    hideLoadingIndicator();
    clearContent();
}

function clearContent() {
    postContainer.innerHTML = "";
    heroSection.innerHTML = "";
}

function updateTitle(titleHtml) {
    const decodedTitle = decodeHtmlEntities(titleHtml);
    document.title = `The Groove Grid | ${decodedTitle}`;
}

function addPostContent(contentHtml) { 
    const content = document.createElement("div");
    content.innerHTML = contentHtml;
    postContainer.appendChild(content);

    // Make images clickable to open in a modal
    const images = content.getElementsByTagName("img");
    for (let img of images) {
        img.style.cursor = "pointer";
        img.addEventListener("click", function() {
            openModal(img.src);
        });
    }
}

function decodeHtmlEntities(text) {
    let textArea = document.createElement("textarea");
    textArea.innerHTML = text;
    return textArea.textContent;
}

// Hero image and title
async function setHeroImageAndTitle(mediaId, titleText) {
    try {
        const image = await fetchData(`https://christianalmli.no/wp-json/wp/v2/media/${mediaId}`);
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

// Comments functionality
async function fetchComments(postId) {
    try {
        const response = await fetch(`https://christianalmli.no/wp-json/wp/v2/comments?post=${postId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching comments:", error);
        handleError(error);
    }
}

function displayComments(comments) {
    // Clear existing comments
    const existingCommentsSection = postContainer.querySelector(".comment-section");
    if (existingCommentsSection) {
        existingCommentsSection.remove();
    }

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


// Related posts functionality
async function fetchRelatedPosts(categoryId, currentPostId) {
    try {
        const posts = await fetchData(`https://christianalmli.no/wp-json/wp/v2/posts?categories=${categoryId}&per_page=100`);
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

// Load specific post
async function loadPost(postId, event) {
    event.preventDefault();
    showLoadingIndicator();
    await fetchAndDisplayPost(postId.toString(), event);
    window.history.pushState({}, "", `blog-post.html?post_id=${postId}`);
}

// Comment form submission
document.getElementById("commentForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    
    const postId = urlParams.get("post_id");
    const commentData = getCommentFormData(postId);

    try {
        await postComment(commentData);
        alert("Comment submitted successfully!");
        const updatedComments = await fetchComments(postId);
        displayComments(updatedComments);
    } catch (error) {
        console.error("Error posting comment:", error);
        alert("Failed to submit comment.");
    }
});

function getCommentFormData(postId) {
    const authorName = document.getElementById("commentAuthor").value;
    const authorEmail = document.getElementById("commentEmail").value;
    const commentContent = document.getElementById("commentText").value;
    return {
        post: postId,
        author_name: authorName,
        author_email: authorEmail,
        content: commentContent
    }
}

async function postComment(commentData) {
    const response = await fetch(`https://christianalmli.no/wp-json/wp/v2/comments`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(commentData)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return await response.json();
}

function openModal(imageSrc) {
    const modalBg = document.createElement("div");
    modalBg.className = "modal-background";

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const modalImg = document.createElement("img");
    modalImg.src = imageSrc;

    // Append elements
    modalContent.appendChild(modalImg);
    modalBg.appendChild(modalContent);
    document.body.appendChild(modalBg);

    document.querySelector("main").classList.add("blur-effect");

    // Show the modal
    modalBg.style.display = "block";

    // Close modal if user clicks outside the image
    modalBg.addEventListener("click", function(event) {
        if (event.target === modalBg || event.target === modalImg) {
            modalBg.remove();
            document.querySelector("main").classList.remove("blur-effect");
        }
    })
}